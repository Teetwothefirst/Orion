const axios = require('axios');
const fs = require('fs');
const db = require('../db');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Parses natural language query to find relevant products
 */
const searchProductsAI = async (query, userId) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key')) {
        console.error('CRITICAL: OpenAI API Key is not configured correctly in .env');
        throw new Error('AI Search service is not configured. Please add a valid OPENAI_API_KEY to the backend .env file.');
    }
    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert agricultural marketplace assistant for Orion. 
                        Extract search parameters from the user's query.
                        Respond ONLY with a JSON object: 
                        { "name": string, "category": string, "location": string, "maxPrice": number, "minQuantity": number }
                        If a field is unknown, use null.`
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const params = response.data.choices[0].message.content;
        const parsedParams = typeof params === 'string' ? JSON.parse(params) : params;
        
        console.log('AI Search Params:', parsedParams);

        let sql = `SELECT p.*, c.name as category_name, u.username as vendor_name 
                   FROM products p 
                   JOIN categories c ON p.category_id = c.id 
                   JOIN users u ON p.vendor_id = u.id 
                   WHERE p.is_available = 1`;
        let queryParams = [];

        if (parsedParams.name) {
            sql += ' AND p.name LIKE ?';
            queryParams.push(`%${parsedParams.name}%`);
        }
        if (parsedParams.location) {
            sql += ' AND p.location LIKE ?';
            queryParams.push(`%${parsedParams.location}%`);
        }
        if (parsedParams.maxPrice) {
            sql += ' AND p.price <= ?';
            queryParams.push(parsedParams.maxPrice);
        }

        return new Promise((resolve, reject) => {
            db.all(sql, queryParams, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

    } catch (error) {
        console.error('AI Search Error:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Transcribes audio file using OpenAI Whisper
 * Uses native FormData and Blob for Node.js 18+
 */
const transcribeAudio = async (filePath) => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key')) {
        console.error('CRITICAL: OpenAI API Key is not configured correctly in .env');
        throw new Error('Transcription service is not configured. Please add a valid OPENAI_API_KEY to the backend .env file.');
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = filePath.includes('\\') ? filePath.split('\\').pop() : filePath.split('/').pop();
        
        // Use native FormData and fetch available in Node 18+ for better compatibility
        const form = new FormData();
        const blob = new Blob([fileBuffer], { type: 'audio/webm' });
        form.append('file', blob, fileName.endsWith('.webm') ? fileName : `${fileName}.webm`);
        form.append('model', 'whisper-1');

        const response = await fetch(WHISPER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: form
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Whisper Transcription Error:', error.message);
        throw error;
    }
};

module.exports = {
    searchProductsAI,
    transcribeAudio
};
