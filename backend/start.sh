#!/bin/bash
echo "Running Migrations and Seeders..."
php artisan migrate --force --seed
echo "Starting Server..."
php artisan serve --host=0.0.0.0 --port=$PORT
