from .base import *

DEBUG = True

# Force filesystem storage in development to avoid S3/Backblaze SSL issues
STORAGE_BACKEND = "filesystem"