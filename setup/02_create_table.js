const {Pool, Client} = require('pg');
const dbConf = require('../conf/db.json');
console.log('Create tables in ' + dbConf.host + ':' + dbConf.port);


const sqlTablePrograms = 'CREATE TABLE IF NOT EXISTS programs (' +
	'program_id varchar PRIMARY KEY,' +
	'created_at timestamp with time zone,' +
	'updated_at timestamp with time zone,' +
	'start_udate bigint,' + // Unix Time
	'end_udate bigint,' +   // Unix Time
	'duration integer,' +
	'start_date timestamp with time zone,' +
	'end_date timestamp with time zone,' +
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
	'title varchar,' +
	'is_reserved boolean' +
	  ');';
		   
const sqlIndexPrograms = 
	'CREATE INDEX IF NOT EXISTS idx_programs_01 ON programs (start_date);' + 
	'CREATE INDEX IF NOT EXISTS idx_programs_02 ON programs (end_date);' +
	'CREATE INDEX IF NOT EXISTS idx_programs_03 ON programs (service_id);' +
	'CREATE INDEX IF NOT EXISTS idx_programs_04 ON programs (genre_ids);' +
	'CREATE INDEX IF NOT EXISTS idx_programs_05 ON programs (created_at);' +
	'CREATE INDEX IF NOT EXISTS idx_programs_06 ON programs (updated_at);' +
	'CREATE INDEX IF NOT EXISTS idx_programs_07 ON programs (event_id);';

const sqlTableProgramGenres = 
	'CREATE TABLE IF NOT EXISTS program_genres (' +
	'program_id varchar,' +
	'genre_id varchar,' +
	'created_at timestamp with time zone,' +
	'updated_at timestamp with time zone,' +
	'PRIMARY KEY (program_id, genre_id)' +
	');';

const client = new Client(dbConf); 
client.connect();

client.query(sqlTablePrograms + sqlIndexPrograms + sqlTableProgramGenres, (err, res) => {
	if (!err) {
		//console.log(res);
		console.log('success!');
	} else {
		console.error(err);
		console.error('failed!');
	}
	client.end();
});

