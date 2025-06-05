#!/usr/bin/env python3
"""
Generate a large CSV file for testing streaming analysis
"""
import csv
import random
import datetime
import sys

def generate_large_csv(filename, num_rows=1000000):
    """Generate a large CSV file with realistic data"""
    
    print(f"Generating {num_rows:,} rows of data...")
    
    # Define columns
    headers = [
        'transaction_id', 'timestamp', 'customer_id', 'product_id', 
        'category', 'quantity', 'unit_price', 'total_amount',
        'payment_method', 'store_location', 'discount_applied',
        'customer_age', 'customer_segment', 'rating', 'returned'
    ]
    
    categories = ['Electronics', 'Clothing', 'Food', 'Home', 'Sports', 'Books', 'Toys', 'Beauty']
    payment_methods = ['Credit Card', 'Debit Card', 'Cash', 'Mobile Payment', 'Gift Card']
    locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia']
    segments = ['Regular', 'Silver', 'Gold', 'Platinum']
    
    start_date = datetime.datetime(2020, 1, 1)
    
    with open(filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        
        # Progress tracking
        progress_interval = num_rows // 20
        
        for i in range(num_rows):
            # Generate row data
            transaction_id = f"TXN{i+1:08d}"
            timestamp = start_date + datetime.timedelta(
                days=random.randint(0, 1095),  # 3 years
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            customer_id = f"CUST{random.randint(1, 50000):06d}"
            product_id = f"PROD{random.randint(1, 5000):05d}"
            category = random.choice(categories)
            quantity = random.randint(1, 10)
            unit_price = round(random.uniform(5.99, 999.99), 2)
            discount = random.choice([0, 0, 0, 0.1, 0.15, 0.2, 0.25])  # Most have no discount
            total_amount = round(quantity * unit_price * (1 - discount), 2)
            payment_method = random.choice(payment_methods)
            store_location = random.choice(locations)
            discount_applied = discount
            customer_age = random.randint(18, 80)
            customer_segment = random.choice(segments)
            rating = round(random.uniform(1, 5), 1) if random.random() > 0.1 else ''  # 10% missing
            returned = random.choice(['Yes', 'No', 'No', 'No', 'No'])  # 20% return rate
            
            writer.writerow([
                transaction_id, timestamp.isoformat(), customer_id, product_id,
                category, quantity, unit_price, total_amount,
                payment_method, store_location, discount_applied,
                customer_age, customer_segment, rating, returned
            ])
            
            # Show progress
            if (i + 1) % progress_interval == 0:
                progress = (i + 1) / num_rows * 100
                print(f"Progress: {progress:.0f}% ({i+1:,} rows)")
                sys.stdout.flush()
    
    print(f"\n✅ Generated {filename}")
    # Get file size
    import os
    size_mb = os.path.getsize(filename) / (1024 * 1024)
    print(f"📊 File size: {size_mb:.1f} MB")
    print(f"📝 Columns: {len(headers)}")
    print(f"📈 Rows: {num_rows:,}")

if __name__ == "__main__":
    # Generate different sized files
    if len(sys.argv) > 1:
        size = sys.argv[1].lower()
        if size == 'small':
            generate_large_csv('test-datasets/large/transactions-small.csv', 10000)
        elif size == 'medium':
            generate_large_csv('test-datasets/large/transactions-medium.csv', 100000)
        elif size == 'large':
            generate_large_csv('test-datasets/large/transactions-large.csv', 1000000)
        elif size == 'xlarge':
            generate_large_csv('test-datasets/large/transactions-xlarge.csv', 5000000)
        else:
            print("Usage: python generate-large-csv.py [small|medium|large|xlarge]")
    else:
        # Default: medium size
        generate_large_csv('test-datasets/large/transactions-medium.csv', 100000)