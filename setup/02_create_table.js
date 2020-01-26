const {Pool, Client} = require('pg');
const dbConf = require('../conf/db.json');
//const tableDef = require('table_def.json');
//console.log(dbConf);

const sqlTablePrograms = 'CREATE TABLE IF NOT EXISTS programs (' +
	'program_id varchar PRIMARY KEY,' +
	'created_at timestamp,' +
	'updated_at timestamp,' +
	'start_udate bigint,' + // Unix Time
	'end_udate bigint,' +   // Unix Time
	'duration integer,' +
	'start_date timestamp,' +
	'end_date timestamp,' +
	'service_id varchar,' + // チャンネル
	'genre_ids varchar,' +  // 正規化される前の生の文字列
	'area_id varchar,' +
	'category integer,' +   // 地上波 or BS
	'description varchar,' +
	'detail_set boolean,' +
	'detail varchar,' +
	'event_id varchar,' +
	'free_ca_mode boolean,' +
	'link_str varchar,' +
	'original_xml varchar,' +
	'summary varchar,' +
	'title varchar' +
	  ');';
		   
const sqlIndexPrograms =
	  'CREATE INDEX IF NOT EXISTS idx_programs_01 ON programs (start_date, end_date);' +
	  'CREATE INDEX IF NOT EXISTS idx_programs_02 ON programs (service_id);' +
	  'CREATE INDEX IF NOT EXISTS idx_programs_03 ON programs (created_at, updated_at);';

const client = new Client(dbConf); 
client.connect();

client.query(sqlTablePrograms + sqlIndexPrograms, (err, res) => {
	if (!err) {
	console.log(res);
	console.log('success!');
	} else {
	console.error(err);
	console.error('failed!');
	}
	client.end();
});

console.log('Complete.');