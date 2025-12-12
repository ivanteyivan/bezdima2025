import importlib
mod = importlib.import_module('src.adk_api')
app = getattr(mod, 'app')
print('Routes:')
for r in app.routes:
    name = type(r).__name__
    path = getattr(r, 'path', getattr(r, 'url', ''))
    methods = getattr(r, 'methods', None)
    print(name, path, methods)
