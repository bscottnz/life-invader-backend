const mongoose = require('mongoose');

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: true,
    });
    console.log('MongoDB connection successful');
  } catch (error) {
    console.log('MongoDB error');
    console.log(error);
    process.exit(1);
  }
}

module.exports = connectDb;
