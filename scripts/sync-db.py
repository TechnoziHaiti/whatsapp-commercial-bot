import sqlite3, json, datetime, os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
wf_path = os.path.join(project_root, 'workflows', 'technozi_commercial_bot_v1.json')
db_path = os.path.join(project_root, '.n8n', '.n8n', 'database.sqlite')

if not os.path.exists(wf_path):
    print('[ERREUR] Workflow JSON introuvable.')
    exit(1)

with open(wf_path, 'r', encoding='utf-8') as f:
    wf = json.load(f)

nodes_json = json.dumps(wf['nodes'])
connections_json = json.dumps(wf['connections'])
now_str = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT versionId FROM workflow_entity WHERE id = ?', ('PTijldnGWAOoF7CI',))
row = cursor.fetchone()
if not row:
    print('[ERREUR] Workflow PTijldnGWAOoF7CI introuvable dans la base SQLite.')
    conn.close()
    exit(1)

version_id = row[0]

cursor.execute('''
    UPDATE workflow_entity 
    SET nodes = ?, connections = ?, updatedAt = ?, active = 1
    WHERE id = ?
''', (nodes_json, connections_json, now_str, 'PTijldnGWAOoF7CI'))

cursor.execute('''
    UPDATE workflow_history
    SET nodes = ?, connections = ?, updatedAt = ?
    WHERE versionId = ?
''', (nodes_json, connections_json, now_str, version_id))

conn.commit()
print('[OK] Base de données n8n synchronisée avec succès avec Pitonbot !')
conn.close()
