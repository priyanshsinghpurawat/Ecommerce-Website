import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const u = await User.find({ email: /priyansh/i });
  console.log('Users:', u.map(x => ({ id: x._id, email: x.email })));
  const o = await Order.find({});
  console.log('Orders:', o.map(x => ({ id: x._id, user: x.user, orderNumber: x.orderNumber })));
  process.exit(0);
}
run();
