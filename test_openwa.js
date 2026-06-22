async function run() {
  const res = await fetch('http://localhost:2785/api/sessions/mecanica-bot/contacts/9754021736576@lid', {
    headers: { 'x-api-key': 'dev-admin-key' }
  });
  if (res.ok) {
    const data = await res.json();
    console.log(data);
  } else {
    console.log(res.status, await res.text());
  }
}
run().catch(console.error);
