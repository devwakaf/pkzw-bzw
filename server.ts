import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { Client } from "ssh2";
import net from "net";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is missing. Using a fallback secret for development.");
}
const ACTUAL_JWT_SECRET = JWT_SECRET || 'dev-secret-bzw-2026-change-me';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // MySQL Connection Pool
  let pool: mysql.Pool | null = null;
  let sshTunnelActive = false;
  let poolPromise: Promise<mysql.Pool | null> | null = null;

  async function getPool() {
    if (pool) return pool;

    if (!poolPromise) {
      poolPromise = (async () => {
        try {
          let dbHost = process.env.DB_HOST || "127.0.0.1";
          let dbPort = parseInt(process.env.DB_PORT || "3306");

          if (process.env.SSH_HOST && !sshTunnelActive) {
            console.log(`Setting up SSH Tunnel to ${process.env.SSH_HOST}:${process.env.SSH_PORT || 22}...`);
            // The SSH tunnel should always forward to the database from the SSH server's perspective.
            // Usually MySQL runs on 127.0.0.1:3306 inside the server itself.
            const targetDbHost = "127.0.0.1";
            const targetDbPort = 3306;

            await new Promise<void>((resolve, reject) => {
              const sshClient = new Client();
              sshClient.on("ready", () => {
                console.log(`SSH Client ready. Forwarding traffic to ${targetDbHost}:${targetDbPort} on remote server...`);
                const server = net.createServer((socket) => {
                  sshClient.forwardOut(
                    "127.0.0.1",
                    0,
                    targetDbHost, // Ini adalah host database dari pandangan server SSH (biasanya 127.0.0.1 atau localhost)
                    targetDbPort, // Ini adalah port database pada server SSH (biasanya 3306)
                    (err, stream) => {
                      if (err) {
                        console.error(`SSH forwardOut error: Gagal menyambung ke pangkalan data pada alamat ${targetDbHost}:${targetDbPort} di dalam server SSH.`);
                        console.error(`🔴 SILA PASTIKAN: Dalam menu "Settings > Environment Variables", nilai DB_PORT mestilah 3306 (port lalai MySQL dalam pelayan) dan BUKAN 3307 (port tempatan HeidiSQL).`);
                        socket.end();
                        return;
                      }
                      
                      socket.on("error", (e) => console.error("Local socket error:", e.message));
                      stream.on("error", (e: any) => console.error("SSH stream error:", e.message));

                      socket.pipe(stream).pipe(socket);
                    }
                  );
                });
                
                server.on("error", (err) => {
                  console.error("SSH Tunnel Server Error:", err);
                  if (!sshTunnelActive) reject(err);
                });

                server.listen(0, "127.0.0.1", () => {
                  const address = server.address() as net.AddressInfo;
                  const localPort = address.port;
                  console.log(`SSH Tunnel established, local port: ${localPort}`);
                  dbHost = "127.0.0.1";
                  dbPort = localPort;
                  sshTunnelActive = true;
                  resolve();
                });
              }).on("error", (err) => {
                console.error("SSH Client Error:", err);
                sshTunnelActive = false;
                poolPromise = null;
                // If we haven't resolved the promise yet, reject it
                reject(err);
              }).on("close", () => {
                console.log("SSH Tunnel closed, resetting pool...");
                sshTunnelActive = false;
                poolPromise = null;
              }).connect({
                host: process.env.SSH_HOST,
                port: parseInt(process.env.SSH_PORT || "1437"),
                username: process.env.SSH_USER,
                password: process.env.SSH_PASSWORD,
                privateKey: process.env.SSH_PRIVATE_KEY ? process.env.SSH_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
                keepaliveInterval: 10000, // Send keepalive every 10 seconds
                keepaliveCountMax: 3
              });
            });
          }

          pool = mysql.createPool({
            host: dbHost,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: dbPort,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true,
          });
          console.log("MySQL Pool created on " + dbHost + ":" + dbPort);
          
          // Auto-setup users table if not exists so superadmin can login
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `);
            const [userCountRows]: any = await pool.query("SELECT COUNT(*) as count FROM users");
            if (userCountRows[0].count === 0) {
              const hashedPassword = await bcrypt.hash("admin123", 10);
              await pool.query(
                "INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)",
                [crypto.randomUUID(), "superadmin", hashedPassword, "superadmin", "Super Admin"]
              );
              console.log("Default superadmin created: superadmin / admin123");
            }

            // Proactive programs table setup and migration
            // BZW Settings table
            await pool.query(`
              CREATE TABLE IF NOT EXISTS bzw_settings (
                year INT PRIMARY KEY,
                start_date DATE,
                end_date DATE,
                hijri_year VARCHAR(255)
              )
            `);
            try {
              const [columns]: any = await pool.query("SHOW COLUMNS FROM bzw_settings");
              const columnNames = columns.map((c: any) => c.Field);
              if (!columnNames.includes('hijri_year')) {
                await pool.query("ALTER TABLE bzw_settings ADD COLUMN hijri_year VARCHAR(255)");
              }
            } catch(e) {}


            await pool.query(`
              CREATE TABLE IF NOT EXISTS programs (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time VARCHAR(20),
                location TEXT,
                zone VARCHAR(50),
                activityType VARCHAR(255),
                pic_program TEXT,
                participants TEXT,
                description TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'Dirancang'
              )
            `);

            // Check and add migration columns if missing
            try {
              const [columns]: any = await pool.query("SHOW COLUMNS FROM programs");
              const columnNames = columns.map((c: any) => c.Field);
              
              if (!columnNames.includes('is_deleted')) {
                await pool.query("ALTER TABLE programs ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
                console.log("Migration: Added is_deleted column to programs");
              }
              if (!columnNames.includes('deleted_by')) {
                await pool.query("ALTER TABLE programs ADD COLUMN deleted_by VARCHAR(255)");
                console.log("Migration: Added deleted_by column to programs");
              }
              if (!columnNames.includes('deleted_at')) {
                await pool.query("ALTER TABLE programs ADD COLUMN deleted_at DATETIME");
                console.log("Migration: Added deleted_at column to programs");
              }
              if (!columnNames.includes('pic_program') && columnNames.includes('committee')) {
                await pool.query("ALTER TABLE programs CHANGE COLUMN committee pic_program TEXT");
                console.log("Migration: Renamed committee to pic_program");
              } else if (!columnNames.includes('pic_program')) {
                await pool.query("ALTER TABLE programs ADD COLUMN pic_program TEXT");
                console.log("Migration: Added pic_program column to programs");
              }
              
              // New Reporting columns
              if (!columnNames.includes('zakat_collection')) {
                await pool.query("ALTER TABLE programs ADD COLUMN zakat_collection DECIMAL(15,2) DEFAULT 0");
              }
              if (!columnNames.includes('wakaf_collection')) {
                await pool.query("ALTER TABLE programs ADD COLUMN wakaf_collection DECIMAL(15,2) DEFAULT 0");
              }
              if (!columnNames.includes('payers_count')) {
                await pool.query("ALTER TABLE programs ADD COLUMN payers_count INT DEFAULT 0");
              }
              if (!columnNames.includes('payment_type')) {
                await pool.query("ALTER TABLE programs ADD COLUMN payment_type VARCHAR(255)");
              }
              if (!columnNames.includes('program_cost')) {
                await pool.query("ALTER TABLE programs ADD COLUMN program_cost DECIMAL(15,2) DEFAULT 0");
              }
              
              await pool.query(`
                CREATE TABLE IF NOT EXISTS program_collections (
                  id VARCHAR(255) PRIMARY KEY,
                  program_id VARCHAR(255) NOT NULL,
                  collection_type VARCHAR(50) NOT NULL,
                  amount DECIMAL(15,2) DEFAULT 0,
                  payers_count INT DEFAULT 0,
                  payment_type VARCHAR(255),
                  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
                )
              `);
              
            } catch (err) {
              console.error("Migration check failed:", err);
            }
          } catch(e) {
            console.error("Error auto-setting up tables:", e);
          }

          return pool;
        } catch (error) {
          console.error("Failed to create MySQL pool or SSH tunnel:", error);
          poolPromise = null; // reset so it can be retried
          throw error;
        }
      })();
    }
    return poolPromise;
  }

  async function executeDb(req: any, res: any, queryFn: (p: mysql.Pool) => Promise<any>) {
    try {
      const p = await getPool();
      if (!p) throw new Error("Database connection failed");
      const result = await queryFn(p);
      return result;
    } catch (error: any) {
      if (
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.message.includes('Connection lost') ||
        error.code === 'ECONNREFUSED' ||
        error.message.includes('SSH')
      ) {
        console.log("Database connection lost. Resetting pool...");
        if (pool) {
          pool.end().catch(() => {});
          pool = null;
        }
        poolPromise = null;
        sshTunnelActive = false;
      }
      if (!res.headersSent) {
        res.status(500).json({ error: `Ralat Pangkalan Data: ${error.message}. (Sila semak konfigurasi DB/SSH)` });
      }
      throw error; // keep it for the outer catch if any
    }
  }

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, ACTUAL_JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'superadmin') {
      next();
    } else {
      res.sendStatus(403);
    }
  };

  // Database Initialization Utility
  app.post("/api/db/setup", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      await executeDb(req, res, async (p) => {
        await p.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL
          )
        `);

        await p.query(`
          CREATE TABLE IF NOT EXISTS programs (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            time VARCHAR(20),
            location TEXT,
            zone VARCHAR(50),
            activityType VARCHAR(255),
            pic_program TEXT,
            participants TEXT,
            description TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) DEFAULT 'Dirancang',
            is_deleted TINYINT(1) DEFAULT 0,
            deleted_by VARCHAR(255)
          )
        `);

        try {
          await p.query("ALTER TABLE programs CHANGE COLUMN committee pic_program TEXT");
        } catch (e) {
          try {
             await p.query("ALTER TABLE programs ADD COLUMN pic_program TEXT");
          } catch(e2) {}
        }

        try {
          await p.query("ALTER TABLE programs ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
          await p.query("ALTER TABLE programs ADD COLUMN deleted_by VARCHAR(255)");
          await p.query("ALTER TABLE programs ADD COLUMN deleted_at DATETIME");
        } catch (e) {}

        try {
          await p.query("ALTER TABLE programs ADD COLUMN zakat_collection DECIMAL(15,2) DEFAULT 0");
          await p.query("ALTER TABLE programs ADD COLUMN wakaf_collection DECIMAL(15,2) DEFAULT 0");
          await p.query("ALTER TABLE programs ADD COLUMN payers_count INT DEFAULT 0");
          await p.query("ALTER TABLE programs ADD COLUMN payment_type VARCHAR(255)");
          await p.query("ALTER TABLE programs ADD COLUMN program_cost DECIMAL(15,2) DEFAULT 0");
        } catch (e) {}

        await p.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await p.query(`
          CREATE TABLE IF NOT EXISTS bzw_settings (
            year INT PRIMARY KEY,
            start_date DATE,
            end_date DATE,
            hijri_year VARCHAR(255)
          )
        `);
        try {
          const [columns]: any = await p.query("SHOW COLUMNS FROM bzw_settings");
          const columnNames = columns.map((c: any) => c.Field);
          if (!columnNames.includes('hijri_year')) {
            await p.query("ALTER TABLE bzw_settings ADD COLUMN hijri_year VARCHAR(255)");
          }
        } catch(e) {}

        await p.query(`
          CREATE TABLE IF NOT EXISTS program_collections (
            id VARCHAR(255) PRIMARY KEY,
            program_id VARCHAR(255) NOT NULL,
            collection_type VARCHAR(50) NOT NULL,
            amount DECIMAL(15,2) DEFAULT 0,
            payers_count INT DEFAULT 0,
            payment_type VARCHAR(255),
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
          )
        `);

        // Create default superadmin if no users exist
        const [userCountRows]: any = await p.query("SELECT COUNT(*) as count FROM users");
        if (userCountRows[0].count === 0) {
          const hashedPassword = await bcrypt.hash("admin123", 10);
          await p.query(
            "INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)",
            [crypto.randomUUID(), "superadmin", hashedPassword, "superadmin", "Super Admin"]
          );
        }

        res.json({ message: "Tables created successfully" });
      });
    } catch (e) {} // response already sent in executeDb
  });


  // --- Auth Routes ---
  // REMOVED: /api/auth/debug for security. Use controlled admin pages instead.

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt for:", username);
      const [rows]: any = await executeDb(req, res, (p) => p.query("SELECT * FROM users WHERE username = ?", [username]));
      
      const user = rows[0];
      if (!user) {
        console.log("User not found:", username);
        return res.status(401).json({ error: "Kredensial tidak sah" });
      }

      const validPassword = await bcrypt.compare(password, user.password).catch(() => false);
      const isPlaintextMatch = password === user.password;
      
      if (!validPassword && !isPlaintextMatch) {
        console.log("Invalid password for:", username);
        return res.status(401).json({ error: "Kredensial tidak sah" });
      }

      // If they logged in with a plaintext password, let's upgrade it to bcrypt
      if (isPlaintextMatch && !validPassword) {
         try {
             const hashedPassword = await bcrypt.hash(password, 10);
             await executeDb(req, res, (p) => p.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]));
             console.log("Upgraded user password to bcrypt hash in background");
         } catch(e) {}
      }

      console.log("Login successful for:", username);
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name }, 
        ACTUAL_JWT_SECRET, 
        { expiresIn: '24h' }
      );
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
    } catch (e: any) {
        console.error("Login route error:", e);
        if (!res.headersSent) res.status(500).json({ error: "Ralat dalaman semasa log masuk" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // --- User Management Routes ---
  app.get("/api/users", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const [rows] = await executeDb(req, res, (p) => p.query("SELECT id, username, role, name, createdAt FROM users ORDER BY createdAt DESC"));
      res.json(rows);
    } catch (e: any) {
      console.error("Error fetching users:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal mengambil senarai pengguna" });
    }
  });

  app.post("/api/users", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { username, password, role, name } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();
      
      try {
        await executeDb(req, res, (p) => p.query(
          "INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)",
          [id, username, hashedPassword, role, name]
        ));
        res.json({ id, username, role, name });
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: "Username sudah wujud" });
        }
        throw err;
      }
    } catch (e: any) {
      console.error("Error creating user:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal menambah pengguna" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { username, password, role, name } = req.body;
      let query = "UPDATE users SET username = ?, role = ?, name = ? WHERE id = ?";
      let params = [username, role, name, req.params.id];
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query = "UPDATE users SET username = ?, password = ?, role = ?, name = ? WHERE id = ?";
        params = [username, hashedPassword, role, name, req.params.id];
      }

      try {
        await executeDb(req, res, (p) => p.query(query, params));
        res.json({ success: true });
      } catch (err: any) {
         if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: "Username sudah wujud" });
        }
        throw err;
      }
    } catch (e) {}
  });

  app.delete("/api/users/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      await executeDb(req, res, (p) => p.query("DELETE FROM users WHERE id = ?", [req.params.id]));
      res.json({ success: true });
    } catch (e) {}
  });

  // API Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const [rows] = await executeDb(req, res, (p) => p.query("SELECT * FROM categories"));
      res.json(rows);
    } catch (e: any) {
      console.error("Error fetching categories:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal mengambil kategori" });
    }
  });

  app.post("/api/categories", authenticateToken, async (req, res) => {
    try {
      const { id, name } = req.body;
      await executeDb(req, res, (p) => p.query("INSERT INTO categories (id, name) VALUES (?, ?)", [id, name]));
      res.json({ id, name });
    } catch (e: any) {
      if (!res.headersSent) res.status(500).json({ error: "Gagal menambah kategori" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      const { name } = req.body;
      await executeDb(req, res, (p) => p.query("UPDATE categories SET name = ? WHERE id = ?", [name, req.params.id]));
      res.json({ success: true });
    } catch (e: any) {
      if (!res.headersSent) res.status(500).json({ error: "Gagal mengemaskini kategori" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
    try {
      console.log('Deleting category with ID:', req.params.id);
      await executeDb(req, res, (p) => p.query("DELETE FROM categories WHERE id = ?", [req.params.id]));
      console.log('Category deleted from db:', req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      console.error('Error deleting category:', e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal memadam kategori" });
    }
  });

  // BZW Settings
  app.get("/api/bzw-settings", async (req, res) => {
    try {
      const [rows] = await executeDb(req, res, (p) => p.query("SELECT year, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date FROM bzw_settings ORDER BY year ASC"));
      res.json(rows);
    } catch (e: any) {
      console.error("Error fetching bzw_settings:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal mengambil tetapan BZW" });
    }
  });

  app.post("/api/bzw-settings", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { year, start_date, end_date } = req.body;
      const [existing]: any = await executeDb(req, res, (p) => p.query("SELECT year FROM bzw_settings WHERE year = ?", [year]));
      if (existing && existing.length > 0) {
        await executeDb(req, res, (p) => p.query("UPDATE bzw_settings SET start_date = ?, end_date = ? WHERE year = ?", [start_date, end_date, year]));
      } else {
        await executeDb(req, res, (p) => p.query("INSERT INTO bzw_settings (year, start_date, end_date) VALUES (?, ?, ?)", [year, start_date, end_date]));
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error saving bzw_settings:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal menyimpan tetapan BZW" });
    }
  });

  app.delete("/api/bzw-settings/:year", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      await executeDb(req, res, (p) => p.query("DELETE FROM bzw_settings WHERE year = ?", [req.params.year]));
      res.json({ success: true });
    } catch (e: any) {
      if (!res.headersSent) res.status(500).json({ error: "Gagal memadam tetapan BZW" });
    }
  });

  app.get("/api/programs", async (req, res) => {
    try {
      const [programs] = await executeDb(req, res, (p) => p.query("SELECT *, DATE_FORMAT(date, '%Y-%m-%d') as formatted_date FROM programs WHERE is_deleted = 0 ORDER BY date ASC"));
      const [collections] = await executeDb(req, res, (p) => p.query("SELECT * FROM program_collections"));
      
      const programsWithCollections = (programs as any[]).map(prog => {
        const { formatted_date, ...rest } = prog;
        return {
          ...rest,
          date: formatted_date || prog.date,
          collections: (collections as any[]).filter(c => c.program_id === prog.id)
        };
      });
      res.json(programsWithCollections);
    } catch (e: any) {
      console.error("Error fetching programs:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal mengambil senarai aktiviti" });
    }
  });

  app.get("/api/programs/deleted", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const [rows] = await executeDb(req, res, (p) => p.query(`
        SELECT p.*, DATE_FORMAT(p.date, '%Y-%m-%d') as formatted_date, u.name as deleted_by_name 
        FROM programs p 
        LEFT JOIN users u ON p.deleted_by = u.id 
        WHERE p.is_deleted = 1 
        ORDER BY date ASC
      `));
      
      const fixedRows = (rows as any[]).map(r => {
        const { formatted_date, ...rest } = r;
        return {
          ...rest,
          date: formatted_date || r.date
        };
      });
      res.json(fixedRows);
    } catch (e) {}
  });

  app.post("/api/programs", authenticateToken, async (req, res) => {
    try {
      const { id, title, date, time, location, zone, activityType, pic_program, participants, description, status, program_cost, collections } = req.body;
      const finalStatus = status || 'Dirancang';
      
      // Basic sanitization
      const cleanTitle = (title || "").trim();
      if (!cleanTitle) return res.status(400).json({ error: "Tajuk diperlukan" });

      await executeDb(req, res, async (p) => {
        await p.query(
          "INSERT INTO programs (id, title, date, time, location, zone, activityType, pic_program, participants, description, status, program_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [id, cleanTitle, date, time, location, zone, activityType, pic_program, participants, description, finalStatus, program_cost || 0]
        );
        
        if (collections && Array.isArray(collections)) {
          for (const c of collections) {
            await p.query(
              "INSERT INTO program_collections (id, program_id, collection_type, amount, payers_count, payment_type) VALUES (?, ?, ?, ?, ?, ?)",
              [c.id || crypto.randomUUID(), id, c.collection_type, c.amount || 0, c.payers_count || 0, c.payment_type || null]
            );
          }
        }
      });
      res.json({ id, title: cleanTitle, date, time, location, zone, activityType, pic_program, participants, description, status: finalStatus, program_cost, collections });
    } catch (e: any) {
      console.error("Error creating program:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal menyimpan aktiviti" });
    }
  });

  app.put("/api/programs/:id", authenticateToken, async (req, res) => {
    try {
      const { title, date, time, location, zone, activityType, pic_program, participants, description, status, program_cost, collections } = req.body;
      const finalStatus = status || 'Dirancang';
      await executeDb(req, res, async (p) => {
        await p.query(
          "UPDATE programs SET title = ?, date = ?, time = ?, location = ?, zone = ?, activityType = ?, pic_program = ?, participants = ?, description = ?, status = ?, program_cost = ? WHERE id = ?",
          [title, date, time, location, zone, activityType, pic_program, participants, description, finalStatus, program_cost || 0, req.params.id]
        );
        
        await p.query("DELETE FROM program_collections WHERE program_id = ?", [req.params.id]);
        if (collections && Array.isArray(collections)) {
          for (const c of collections) {
            await p.query(
              "INSERT INTO program_collections (id, program_id, collection_type, amount, payers_count, payment_type) VALUES (?, ?, ?, ?, ?, ?)",
              [c.id || crypto.randomUUID(), req.params.id, c.collection_type, c.amount || 0, c.payers_count || 0, c.payment_type || null]
            );
          }
        }
      });
      res.json(req.body);
    } catch (e) {
      console.error("Error updating program:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal mengemaskini aktiviti" });
    }
  });

  app.delete("/api/programs/:id", authenticateToken, async (req, res: any) => {
    try {
      const { password } = req.body;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      if (!password) {
        return res.status(400).json({ error: "Kata laluan diperlukan untuk pengesahan" });
      }

      const result = await executeDb(req, res, (p) => p.query("SELECT password FROM users WHERE id = ?", [userId]));
      const userRows = result[0] as any[];
      const user = userRows[0];
      
      if (!user) {
        return res.status(404).json({ error: "Pengguna tidak dijumpai" });
      }

      const validPassword = await bcrypt.compare(password, user.password).catch(() => false);
      const isPlaintextMatch = password === user.password;

      if (!validPassword && !isPlaintextMatch) {
        return res.status(401).json({ error: "Kata laluan tidak sah" });
      }

      // Admin performs soft delete regardless of role (superadmin can hard delete from trash bin)
      await executeDb(req, res, (p) => p.query("UPDATE programs SET is_deleted = 1, deleted_by = ?, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [userId, req.params.id]));

      return res.json({ success: true });
    } catch (e: any) {
      console.error("Deletion error:", e);
      if (!res.headersSent) {
        res.status(500).json({ error: "Ralat dalaman pelayan semasa memadam: " + e.message });
      }
    }
  });

  app.post("/api/programs/recover/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      await executeDb(req, res, (p) => p.query("UPDATE programs SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?", [req.params.id]));
      res.json({ success: true });
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ error: "Gagal memulihkan aktiviti" });
    }
  });

  app.delete("/api/programs/hard/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      await executeDb(req, res, (p) => p.query("DELETE FROM programs WHERE id = ?", [req.params.id]));
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error hard deleting program:", e);
      if (!res.headersSent) res.status(500).json({ error: "Gagal memadam secara kekal" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
