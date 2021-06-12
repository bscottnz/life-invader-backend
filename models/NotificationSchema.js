const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notificationType: String,
    read: { type: Boolean, default: false },
    entityId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

NotificationSchema.statics.insertNotification = async (
  userTo,
  userFrom,
  notificationType,
  entityId
) => {
  const data = {
    userTo,
    userFrom,
    notificationType,
    entityId,
  };

  // remove notiifcation if it already exists. so you cant spam like - unlike and
  // send loads of notifications
  await Notification.deleteOne(data).catch((err) => console.log(err));

  return Notification.create(data).catch((err) => console.log(err));
};

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
