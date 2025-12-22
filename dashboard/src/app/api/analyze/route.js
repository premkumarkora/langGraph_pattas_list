import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            console.log('Starting analysis stream...');

            // Run the python script using uv with unbuffered output (-u)
            const pythonProcess = spawn('uv', ['run', 'python', '-u', 'market_update_graph.py'], {
                cwd: '/Volumes/vibecoding/pattas_list',
                env: { ...process.env, PATH: process.env.PATH }
            });

            pythonProcess.stdout.on('data', (data) => {
                const text = data.toString();
                console.log(`stdout: ${text}`);
                controller.enqueue(encoder.encode(text));
            });

            pythonProcess.stderr.on('data', (data) => {
                const text = data.toString();
                console.error(`stderr: ${text}`);
                controller.enqueue(encoder.encode(`ERROR: ${text}`));
            });

            pythonProcess.on('close', (code) => {
                console.log(`Child process exited with code ${code}`);
                controller.enqueue(encoder.encode(`\n[Process completed with code ${code}]`));
                controller.close();
            });

            pythonProcess.on('error', (err) => {
                console.error('Failed to start subprocess:', err);
                controller.enqueue(encoder.encode(`\nFATAL ERROR: ${err.message}`));
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
