import mqtt from 'mqtt';

export const createMqttClient = () => {
  // HiveMQ Cloud WSS credentials
  const protocol = 'wss';
  const host = '9fde2eecc93040ba86ea98e093528087.s1.eu.hivemq.cloud';
  const port = 8884; // Standard WSS port for HiveMQ Cloud
  const path = '/mqtt';
  
  const clientId = 'web_' + Math.random().toString(16).substr(2, 8);

  const url = `${protocol}://${host}:${port}${path}`;
  
  // Note: Credentials should ideally come from env vars
  const options = {
    clientId,
    username: process.env.NEXT_PUBLIC_MQTT_USERNAME || 'hoescodes',
    password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || '010702Bdg',
    keepalive: 60,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  };

  console.log('Connecting to MQTT WSS:', url);
  const client = mqtt.connect(url, options);

  client.on('error', (err) => {
    console.error('❌ MQTT Connection Error:', err);
  });

  client.on('close', () => {
    console.warn('⚠️ MQTT Connection Closed');
  });
  
  client.on('offline', () => {
    console.warn('⚠️ MQTT Client Offline');
  });

  return client;
};
