#!/bin/bash
# Cleanup stale git lock file
echo "Removing git lock file..."
rm -f .git/index.lock
if [ $? -eq 0 ]; then
    echo "Lock file removed successfully"
else
    echo "No lock file found or already removed"
fi
echo "Done!"
