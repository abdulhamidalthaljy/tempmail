const axios = require('axios');

class MailgunService {
    constructor() {
        this.apiKey = process.env.MAILGUN_API_KEY;
        this.baseURL = 'https://api.mailgun.net/v3';
        this.domain = process.env.MAILGUN_DOMAIN || process.env.EMAIL_DOMAIN;

        if (!this.apiKey) {
            console.warn('⚠️ Mailgun API key not configured');
        }
    }

    // Create axios instance with authentication
    getAxiosInstance() {
        return axios.create({
            baseURL: this.baseURL,
            auth: {
                username: 'api',
                password: this.apiKey
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }

    // Verify domain setup
    async verifyDomain(domain = this.domain) {
        try {
            console.log(`🔍 Verifying Mailgun domain: ${domain}`);

            const mailgun = this.getAxiosInstance();
            const response = await mailgun.get(`/domains/${domain}`);

            return {
                success: true,
                domain: domain,
                status: response.data.domain.state,
                receiving_records: response.data.receiving_dns_records,
                sending_records: response.data.sending_dns_records
            };

        } catch (error) {
            console.error('❌ Domain verification failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Domain verification failed'
            };
        }
    }

    // Add domain to Mailgun
    async addDomain(domain) {
        try {
            console.log(`➕ Adding domain to Mailgun: ${domain}`);

            const mailgun = this.getAxiosInstance();
            const params = new URLSearchParams();
            params.append('name', domain);
            params.append('smtp_password', 'generated'); // Let Mailgun generate password

            const response = await mailgun.post('/domains', params);

            console.log('✅ Domain added successfully');
            return {
                success: true,
                domain: response.data.domain,
                dns_records: response.data.receiving_dns_records
            };

        } catch (error) {
            console.error('❌ Failed to add domain:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to add domain'
            };
        }
    }

    // Set up webhook for incoming emails
    async setupWebhook(domain, webhookUrl) {
        try {
            console.log(`🔗 Setting up webhook for ${domain}: ${webhookUrl}`);

            const mailgun = this.getAxiosInstance();
            const params = new URLSearchParams();
            params.append('id', 'delivered');
            params.append('url', webhookUrl);

            await mailgun.post(`/domains/${domain}/webhooks`, params);

            console.log('✅ Webhook configured successfully');
            return { success: true };

        } catch (error) {
            console.error('❌ Webhook setup failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Webhook setup failed'
            };
        }
    }

    // Get domain statistics
    async getDomainStats(domain = this.domain) {
        try {
            const mailgun = this.getAxiosInstance();
            const response = await mailgun.get(`/domains/${domain}/stats/total`);

            return {
                success: true,
                stats: response.data.stats
            };

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to get domain stats'
            };
        }
    }

    // Test Mailgun API connection
    async testConnection() {
        try {
            console.log('🧪 Testing Mailgun API connection...');

            const mailgun = this.getAxiosInstance();
            const response = await mailgun.get('/domains');

            console.log('✅ Mailgun API connection successful');
            return {
                success: true,
                domains: response.data.items.length,
                message: 'Mailgun API connection successful'
            };

        } catch (error) {
            console.error('❌ Mailgun API connection failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'API connection failed'
            };
        }
    }

    // Generate DNS instructions for domain setup
    getDNSInstructions(domain) {
        return {
            domain: domain,
            mx_records: [
                {
                    type: 'MX',
                    name: '@',
                    value: 'mxa.mailgun.org',
                    priority: 10
                },
                {
                    type: 'MX',
                    name: '@',
                    value: 'mxb.mailgun.org',
                    priority: 10
                }
            ],
            txt_records: [
                {
                    type: 'TXT',
                    name: '@',
                    value: 'v=spf1 include:mailgun.org ~all'
                }
            ],
            instructions: [
                '1. Add the MX records to your DNS',
                '2. Add the TXT record for SPF',
                '3. Wait for DNS propagation (up to 24 hours)',
                '4. Verify domain in Mailgun dashboard',
                '5. Configure webhook URL in your application'
            ]
        };
    }
}

module.exports = new MailgunService();
