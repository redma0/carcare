# src/app/calculate_fuel_costs.py
import psycopg2
from decimal import Decimal

def calculate_and_store_fuel_costs():
    db_params = {
        "host": "localhost",
        "port": "5432",
        "database": "postgres",
        "user": "postgres",
        "password": "riyad2003"
    }

    try:
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        # Get latest fuel prices
        cur.execute("""
            SELECT price_95, price_diesel, price_lpg 
            FROM fuel_prices 
            ORDER BY timestamp DESC 
            LIMIT 1
        """)
        fuel_prices = cur.fetchone()
        if not fuel_prices:
            raise Exception("No fuel prices found")

        # Convert fuel prices to Decimal
        price_95 = Decimal(str(fuel_prices[0]))
        price_diesel = Decimal(str(fuel_prices[1]))
        price_lpg = Decimal(str(fuel_prices[2]))

        print(f"\nCurrent Fuel Prices:")
        print(f"95: {price_95} RSD")
        print(f"Diesel: {price_diesel} RSD")
        print(f"LPG: {price_lpg} RSD")

        # Get cars data
        cur.execute("""
            SELECT 
                id,
                make,
                model,
                fuel_type,
                fuel_economy,
                kilometers,
                initial_kilometers
            FROM cars
            WHERE fuel_economy IS NOT NULL
        """)
        cars = cur.fetchall()

        print("\nCalculating monthly fuel costs...")
        
        for car in cars:
            car_id, make, model, fuel_type, fuel_economy, kilometers, initial_kilometers = car
            
            print(f"\nProcessing {make} {model}:")
            
            # Convert all numbers to Decimal for consistent calculation
            total_km = Decimal(str(kilometers - initial_kilometers))
            fuel_economy = Decimal(str(fuel_economy))
            
            # Calculate monthly fuel consumption (L/month)
            monthly_fuel = (total_km / Decimal('100')) * fuel_economy

            # Get appropriate fuel price
            fuel_price = None
            if fuel_type == '95':
                fuel_price = price_95
            elif fuel_type == 'diesel':
                fuel_price = price_diesel
            elif fuel_type == 'lpg':
                fuel_price = price_lpg

            if not fuel_price:
                print(f"❌ Invalid fuel type: {fuel_type}")
                continue

            # Calculate monthly cost
            monthly_cost = monthly_fuel * fuel_price

            # Update the car's monthly fuel cost
            cur.execute("""
                UPDATE cars 
                SET monthly_fuel_cost = %s,
                    last_calculated = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (monthly_cost, car_id))

            print(f"""✅ Calculation successful:
- Total Distance: {total_km:.1f} km
- Fuel Economy: {fuel_economy} L/100km
- Fuel Used: {monthly_fuel:.1f} L
- Fuel Price ({fuel_type}): {fuel_price} RSD/L
- Monthly Cost: {monthly_cost:.2f} RSD""")

        conn.commit()
        print("\nMonthly fuel costs updated successfully!")

    except Exception as e:
        print(f"Error calculating fuel costs: {e}")
        if conn:
            conn.rollback()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    calculate_and_store_fuel_costs()
