const mongoose = require('mongoose');

const mongoUri = "mongodb://shubh:123@ac-4wu1p1f-shard-00-00.y5jaid1.mongodb.net:27017,ac-4wu1p1f-shard-00-01.y5jaid1.mongodb.net:27017,ac-4wu1p1f-shard-00-02.y5jaid1.mongodb.net:27017/?ssl=true&replicaSet=atlas-d09d02-shard-0&authSource=admin&appName=Cluster0";

const EmailLogSchema = new mongoose.Schema({
  recipient: String,
  subject: String,
  type: String,
  status: String,
  provider: String,
  providerResponse: String,
  errorMsg: String,
  attempts: Number,
  createdAt: Date
});

const EmailLog = mongoose.model('EmailLog', EmailLogSchema);

async function check() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    const log = await EmailLog.findById("6a55206290875178c2901706");
    if (log) {
      console.log("LOG DETAILS:");
      console.log(JSON.stringify(log, null, 2));
    } else {
      console.log("Log 6a55206290875178c2901706 not found. Pulling latest log...");
      const latest = await EmailLog.findOne().sort({ createdAt: -1 });
      console.log(JSON.stringify(latest, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
