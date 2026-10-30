import { setServers } from 'node:dns';
import mongoose from 'mongoose';

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI; 

    if (!uri) {
        throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    const configuredDnsServers = process.env.MONGODB_DNS_SERVERS;

    if (configuredDnsServers !== undefined) {
        const dnsServers = configuredDnsServers.split(',').map(server => server.trim()).filter(Boolean);

        if (dnsServers.length === 0) {
            throw new Error('MONGODB_DNS_SERVERS must contain at least one DNS server address');
        }

        setServers(dnsServers);
    }

    await mongoose.connect(uri);   

    console.log("{DB CONNECTION} Connnected to MongoDB Atlas");

    
}