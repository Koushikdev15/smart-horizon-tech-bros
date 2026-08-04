import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessingStep extends Document {
  batchId: mongoose.Types.ObjectId;
  processorId: mongoose.Types.ObjectId;
  stepName: 'Cleaning' | 'Drying' | 'Grinding' | 'Extracting' | 'Quality Check';
  temperature?: number;
  humidity?: number;
  durationHours?: number;
  ipfsReportCid?: string;
  fabricTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessingStepSchema: Schema = new Schema(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    processorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stepName: { type: String, required: true },
    temperature: { type: Number },
    humidity: { type: Number },
    durationHours: { type: Number },
    ipfsReportCid: { type: String },
    fabricTxHash: { type: String },
  },
  { timestamps: true }
);

export const ProcessingStep = mongoose.model<IProcessingStep>('ProcessingStep', ProcessingStepSchema);
