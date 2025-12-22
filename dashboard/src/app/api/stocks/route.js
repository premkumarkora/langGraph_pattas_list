import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Absolute path to the database
const BASE_PATH = '/Volumes/vibecoding/pattas_list';
const DB_PATH = path.join(BASE_PATH, 'pattas_list.db');
const NEWS_JSON_PATH = path.join(BASE_PATH, 'news_links.json');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const db = new Database(DB_PATH, { verbose: console.log });

        // Get latest date from daily_signals
        const dateRow = db.prepare('SELECT MAX(date) as max_date FROM daily_signals').get();
        const latestDate = dateRow ? dateRow.max_date : null;

        if (!latestDate) {
            return NextResponse.json({ error: 'No data found' }, { status: 404 });
        }

        const query = `
      SELECT 
        p.ticker_symbol, 
        p.company_name, 
        p.sector, 
        p.market_cap, 
        p.p_e_ratio, 
        p.fii_pct, 
        p.dii_pct, 
        p.owner_pct,
        d.price, 
        d.rsi, 
        d.macd_signal, 
        d.sentiment_score, 
        d.status,
        d.held_pct_insiders,
        d.trailing_pe
      FROM pattas_list p
      LEFT JOIN daily_signals d ON p.ticker_symbol = d.ticker_symbol
      WHERE d.date = ?
      ORDER BY p.sector ASC, p.company_name ASC
    `;

        const rows = db.prepare(query).all(latestDate);

        // Read News Links JSON
        let newsMap = {};
        if (fs.existsSync(NEWS_JSON_PATH)) {
            try {
                const raw = fs.readFileSync(NEWS_JSON_PATH, 'utf-8');
                newsMap = JSON.parse(raw);
            } catch (e) {
                console.error("Failed to read news_links.json", e);
            }
        }

        // Merge News Links & Group by Sector
        const grouped = rows.reduce((acc, row) => {
            const sector = row.sector || 'Uncategorized';
            if (!acc[sector]) {
                acc[sector] = [];
            }

            // Inject News List (Handle both Array and Legacy String formats)
            const newsData = newsMap[row.ticker_symbol];

            if (Array.isArray(newsData)) {
                row.news_list = newsData;
            } else if (typeof newsData === 'string') {
                // Legacy support for when we just stored a URL string
                row.news_list = [{
                    title: "Latest News",
                    link: newsData,
                    publisher: "External",
                    time: Date.now() / 1000
                }];
            } else {
                row.news_list = [];
            }

            acc[sector].push(row);
            return acc;
        }, {});

        return NextResponse.json({
            data: grouped,
            date: latestDate
        });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Database access failed' }, { status: 500 });
    }
}
