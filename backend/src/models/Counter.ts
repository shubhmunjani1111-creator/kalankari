import { Schema, model } from 'mongoose';

const CounterSchema = new Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

const CounterModel = model('Counter', CounterSchema);
export default CounterModel;

export const getNextOrderNumber = async (year: number): Promise<string> => {
  const counter = await CounterModel.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  const seqStr = String(counter.seq).padStart(3, '0');
  const shortYear = String(year).slice(-2);
  return `KLK${shortYear}-${seqStr}`;
};
