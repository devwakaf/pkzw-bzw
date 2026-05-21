import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { Client } from "ssh2";
import net from "net";
import crypto from "crypto";

dotenv.config();

async function runTest() {
  console.log("Starting DB insertion test...");
  let dbHost = process.env.DB_HOST || "127.0.0.1";
  let dbPort = parseInt(process.env.DB_PORT || "3306");

  try {
    if (process.env.SSH_HOST) {
      console.log(`Setting up SSH Tunnel to ${process.env.SSH_HOST}:${process.env.SSH_PORT || 22}...`);
      const targetDbHost = "127.0.0.1";
      const targetDbPort = 3306;

      await new Promise<void>((resolve, reject) => {
        const sshClient = new Client();
        sshClient.on("ready", () => {
          console.log(`SSH Client ready. Forwarding traffic...`);
          const server = net.createServer((socket) => {
            sshClient.forwardOut(
              "127.0.0.1",
              0,
              targetDbHost,
              targetDbPort,
              (err, stream) => {
                if (err) {
                  console.error("SSH Forwardout Error:", err);
                  socket.end();
                  return;
                }
                socket.pipe(stream).pipe(socket);
              }
            );
          });
          
          server.on("error", (err) => reject(err));
          server.listen(0, "127.0.0.1", () => {
            const address = server.address() as net.AddressInfo;
            dbHost = "127.0.0.1";
            dbPort = address.port;
            console.log(`SSH Tunnel local port: ${dbPort}`);
            resolve();
          });
        }).on("error", (err) => reject(err)).connect({
          host: process.env.SSH_HOST,
          port: parseInt(process.env.SSH_PORT || "1437"),
          username: process.env.SSH_USER,
          password: process.env.SSH_PASSWORD,
          privateKey: process.env.SSH_PRIVATE_KEY ? process.env.SSH_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        });
      });
    }

    console.log(`Connecting to database ${process.env.DB_NAME} at ${dbHost}:${dbPort}...`);
    const connection = await mysql.createConnection({
      host: dbHost,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: dbPort,
    });

    console.log("Database connected. Starting transaction...");
    const pId = crypto.randomUUID();
    
    await connection.beginTransaction();
    console.log("Transaction started...");

    await connection.query(
      "INSERT INTO programs (id, title, date, time, location, zone, activityType, pic_program, participants, description, status, program_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [pId, "Test Program via Script", "2026-05-21", "10:00", "Test Location", "Zon Tengah", "Kaunter", "Test PIC", "10", "Test Desc", "Dirancang", 150.00]
    );
    console.log("Program inserted...");

    await connection.query(
      "INSERT INTO program_collections (id, program_id, collection_type, amount, payers_count, payment_type) VALUES (?, ?, ?, ?, ?, ?)",
      [crypto.randomUUID(), pId, "Zakat", 500.00, 12, "Kaunter"]
    );
    console.log("Collection inserted...");

    await connection.commit();
    console.log("Transaction committed successfully!");

    const [collections]: any = await connection.query("SELECT * FROM program_collections WHERE program_id = ?", [pId]);
    console.log("Inserted collection rows:", JSON.stringify(collections, null, 2));

    // Cleanup: delete the test program
    await connection.query("DELETE FROM programs WHERE id = ?", [pId]);
    console.log("Test program cleaned up from database.");

    await connection.end();
    console.log("Connection closed.");
    process.exit(0);
  } catch (err: any) {
    console.error("Error executing DB transaction test:", err.message, err.stack);
    process.exit(1);
  }
}

runTest();
