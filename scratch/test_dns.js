async function test() {
    const url = 'https://gnuyabwkmxghwimkxffz.supabase.co';
    console.log(`Testing native fetch to ${url}...`);
    try {
        const res = await fetch(url);
        console.log(`Response status: ${res.status}`);
    } catch (err) {
        console.error('Fetch failed:', err.message);
        if (err.cause) console.error('Cause:', err.cause.message);
    }
}

test();
