import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
});

const chatThreadSchema = new mongoose.Schema(
  {
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creatorName: { type: String, default: '' },
    creatorAvatar: { type: String, default: '' },
    creatorRole: { type: String, default: '' },
    participantName: { type: String, required: true },
    participantAvatar: { type: String, default: '' },
    participantRole: { type: String, default: '' },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: String, default: '' },
    messages: [messageSchema]
  },
  { timestamps: true }
);

export default mongoose.models.ChatThread || mongoose.model('ChatThread', chatThreadSchema);
