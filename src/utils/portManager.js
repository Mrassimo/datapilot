import net from 'net';
import chalk from 'chalk';

export function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
}

export async function findAvailablePort(startPort = 3000, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const inUse = await checkPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

export async function handlePortConflict(requestedPort) {
  const isInUse = await checkPortInUse(requestedPort);
  
  if (isInUse) {
    console.log(chalk.yellow(`⚠️  Port ${requestedPort} is already in use.`));
    
    // Check if it's likely another DataPilot instance
    try {
      const http = await import('http');
      
      const checkServer = () => new Promise((resolve, reject) => {
        const req = http.default.request({
          hostname: 'localhost',
          port: requestedPort,
          path: '/api/health',
          method: 'GET',
          timeout: 2000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch (e) {
              reject(e);
            }
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        req.end();
      });
      
      const healthData = await checkServer();
      if (healthData.status === 'OK') {
        console.log(chalk.green(`✅ DataPilot is already running at http://localhost:${requestedPort}`));
        console.log(chalk.blue('🌐 Opening in your browser...'));
        return { shouldLaunch: false, port: requestedPort, url: `http://localhost:${requestedPort}` };
      }
    } catch (error) {
      // Not a DataPilot server, continue with finding new port
    }
    
    // Find alternative port
    const availablePort = await findAvailablePort(requestedPort + 1);
    console.log(chalk.blue(`🔄 Using alternative port: ${availablePort}`));
    return { shouldLaunch: true, port: availablePort, url: `http://localhost:${availablePort}` };
  }
  
  return { shouldLaunch: true, port: requestedPort, url: `http://localhost:${requestedPort}` };
}