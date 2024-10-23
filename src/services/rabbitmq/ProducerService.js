/* eslint-disable max-len */
/* eslint-disable linebreak-style */

const amqp = require('amqplib');

// Pada pembuatan ProducerService, kita tidak menggunakan class, melainkan cukup dengan objek biasa. Hal ini karena kita tidak membutuhkan adanya penggunaan keyword this yang merujuk pada instance dari class. Berbeda dengan service postgres, kita membutuhkan this untuk mengakses properti _pool.

const ProducerService = {
  sendMessage: async (queue, message) => {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
      durable: true,
    });

    await channel.sendToQueue(queue, Buffer.from(message));

    setTimeout(() => {
      connection.close();
    }, 1000);
  },
};

module.exports = ProducerService;
