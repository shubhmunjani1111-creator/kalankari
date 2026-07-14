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
  createdAt: Date
});

const EmailLog = mongoose.model('EmailLog', EmailLogSchema);

async function check() {
  try {
    await mongoose.connect(mongoUri);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const logs = await EmailLog.find({ createdAt: { $gte: oneHourAgo } }).sort({ createdAt: -1 });
    console.log(`FOUND ${logs.length} EMAIL LOGS IN THE LAST HOUR:`);
    logs.forEach(log => {
      console.log(`[${log.createdAt.toISOString()}] To: ${log.recipient} | Subject: "${log.subject}" | Status: ${log.status} | Provider: ${log.provider} | Err: ${log.errorMsg || 'None'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
