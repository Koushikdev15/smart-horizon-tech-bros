import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabaseAdmin';

async function main() {
  const { data, error } = await supabaseAdmin.from('app_login').select('id, full_name, email, region').limit(20);
  console.log(error);
  console.log(JSON.stringify(data, null, 2));
}
main();
