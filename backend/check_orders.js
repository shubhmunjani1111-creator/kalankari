const mongoose = require('mongoose');

const mongoUri = "mongodb://shubh:123@ac-4wu1p1f-shard-00-00.y5jaid1.mongodb.net:27017,ac-4wu1p1f-shard-00-01.y5jaid1.mongodb.net:27017,ac-4wu1p1f-shard-00-02.y5jaid1.mongodb.net:27017/?ssl=true&replicaSet=atlas-d09d02-shard-0&authSource=admin&appName=Cluster0";

// Define inline schema to match Order model
const OrderSchema = new mongoose.Schema({
  payable: Number,
  paymentMethod: String,
  paymentStatus: String,
  status: String,
  shippingAddress: {
    name: String,
    email: String,
    phone: String
  },
  createdAt: Date
});

const Order = mongoose.model('Order', OrderSchema);

async function check() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
    console.log("LAST 5 ORDERS:");
    console.log(JSON.stringify(orders, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
