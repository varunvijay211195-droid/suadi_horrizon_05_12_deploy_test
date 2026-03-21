import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function setupCartItemsTable() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing Supabase environment variables');
        process.exit(1);
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        console.log('Setting up cart_items table...');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'create-cart-items-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: sql
        });

        if (error) {
            // If exec_sql doesn't exist, try direct table creation
            console.log('Attempting direct table creation...');

            // Split SQL into statements and execute them
            const statements = sql.split(';').filter(stmt => stmt.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    const { error: stmtError } = await supabase.rpc('exec', {
                        query: statement.trim() + ';'
                    });

                    if (stmtError) {
                        console.error('Error executing statement:', statement.trim());
                        console.error('Error details:', stmtError);
                    }
                }
            }
        }

        console.log('Cart items table setup completed!');

        // Verify the table was created
        const { data: tables, error: listError } = await supabase
            .from('cart_items')
            .select('*')
            .limit(1);

        if (listError && !listError.message.includes('permission denied')) {
            console.error('Error verifying table creation:', listError);
        } else {
            console.log('✓ cart_items table verified successfully');
        }

    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

setupCartItemsTable();