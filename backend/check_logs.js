const mongoose = require('mongoose');

const mongoUri = "mongodb://shubh:123@ac-4wu1p1f-shard-00-00.y5jaid1.mongodb.net:27017,ac-4wu1p1f-shard-00-01.y5jaid1.mongodb.net:27017,ac-4wu1p1f-shard-00-02.y5jaid1.mongodb.net:27017/?ssl=true&replicaSet=atlas-d09d02-shard-0&authSource=admin&appName=Cluster0";

// Define inline schema to match EmailLog model
const EmailLogSchema = new mongoose.Schema({
  recipient: String,
  subject: String,
  type: String,
  status: String,
  provider: String,
  providerResponse: String,
  attempts: Number,
  createdAt: Date
});

const EmailLog = mongoose.model('EmailLog', EmailLogSchema);

async function check() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(10);
    console.log("LAST 10 EMAIL LOGS:");
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
