
from google.oauth2 import id_token
import inspect

print(inspect.signature(id_token.verify_oauth2_token))
