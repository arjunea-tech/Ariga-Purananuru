#!/bin/bash
echo "Running Migrations and Seeders..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan migrate --force --seed
echo "Starting Server..."
php artisan serve --host=0.0.0.0 --port=$PORT
