import os

apps = ['gallo', 'turagua', 'bateylate']
for app in apps:
    file_path = '/home/ubuntu/' + app + '/backend/index.js'
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    content = content.replace('app.use(express.json());', 'app.use(express.json({ limit: "50mb" }));')
    content = content.replace('app.use(express.urlencoded({ extended: true }));', 'app.use(express.urlencoded({ limit: "50mb", extended: true }));')
    
    with open(file_path, 'w') as f:
        f.write(content)
