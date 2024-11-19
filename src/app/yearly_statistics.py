import psycopg2
from datetime import datetime
from decimal import Decimal
from config.db_config import get_db_connection

def calculate_yearly_statistics():
    try:
        # Get database configuration
        db_params = get_db_connection()
        
        # Verify all environment variables are loaded
        missing_vars = [key for key, value in db_params.items() if value is None]
        if missing_vars:
            raise ValueError(f"Missing environment variables: {', '.join(missing_vars)}")

        conn = None
        cur = None
        
        try:
            # Connect to database
            conn = psycopg2.connect(**db_params)
            cur = conn.cursor()

            # Get current year
            current_year = datetime.now().year

            print(f"\nYearly Statistics for {current_year}")
            print("=" * 80)

            # Query for yearly statistics by car
            cur.execute("""
                WITH yearly_stats AS (
                    SELECT 
                        c.id,
                        c.make,
                        c.model,
                        c.fuel_type,
                        EXTRACT(YEAR FROM cu.update_timestamp) as update_year,
                        SUM(COALESCE(cu.kilometers_driven, 0)) as yearly_km,
                        SUM(COALESCE(cu.fuel_cost_for_update, 0)) as yearly_cost
                    FROM cars c
                    LEFT JOIN car_updates cu ON c.id = cu.car_id
                    WHERE EXTRACT(YEAR FROM cu.update_timestamp) = %s
                    GROUP BY 
                        c.id, 
                        c.make, 
                        c.model, 
                        c.fuel_type,
                        EXTRACT(YEAR FROM cu.update_timestamp)
                )
                SELECT 
                    make || ' ' || model as car,
                    fuel_type,
                    yearly_km,
                    ROUND(yearly_cost::numeric, 2) as yearly_cost,
                    CASE 
                        WHEN yearly_km > 0 
                        THEN ROUND((yearly_cost / yearly_km * 100)::numeric, 2)
                        ELSE 0 
                    END as cost_per_100km
                FROM yearly_stats
                ORDER BY yearly_cost DESC;
            """, (current_year,))

            car_stats = cur.fetchall()

            if car_stats:
                print("\nYearly Statistics by Car:")
                print("-" * 80)
                print(f"{'Car':<30} {'Fuel Type':<10} {'KM':<10} {'Cost (RSD)':<15} {'RSD/100km'}")
                print("-" * 80)
                
                for stat in car_stats:
                    car, fuel_type, km, cost, cost_per_100 = stat
                    print(f"{car:<30} {fuel_type:<10} {km or 0:<10} {cost or 0:<15} {cost_per_100}")

            # Query for total yearly statistics
            cur.execute("""
                SELECT 
                    COUNT(DISTINCT car_id) as total_cars,
                    SUM(COALESCE(kilometers_driven, 0)) as total_km,
                    SUM(COALESCE(fuel_cost_for_update, 0)) as total_cost
                FROM car_updates
                WHERE EXTRACT(YEAR FROM update_timestamp) = %s;
            """, (current_year,))

            totals = cur.fetchone()
            
            if totals:
                total_cars, total_km, total_cost = totals
                print("\nTotal Statistics:")
                print("-" * 80)
                print(f"Total Cars: {total_cars or 0}")
                print(f"Total Kilometers: {total_km or 0:,} km")
                print(f"Total Fuel Cost: {total_cost or 0:,.2f} RSD")
                
                if total_km and total_km > 0:
                    avg_cost_per_km = Decimal(str(total_cost)) / Decimal(str(total_km))
                    print(f"Average Cost per 100km: {(avg_cost_per_km * 100):,.2f} RSD")

            # Get monthly breakdown
            print("\nMonthly Breakdown:")
            print("-" * 80)
            cur.execute("""
                SELECT 
                    TO_CHAR(update_timestamp, 'Month') as month,
                    SUM(COALESCE(kilometers_driven, 0)) as monthly_km,
                    ROUND(SUM(COALESCE(fuel_cost_for_update, 0))::numeric, 2) as monthly_cost
                FROM car_updates
                WHERE EXTRACT(YEAR FROM update_timestamp) = %s
                GROUP BY 
                    EXTRACT(MONTH FROM update_timestamp),
                    TO_CHAR(update_timestamp, 'Month')
                ORDER BY EXTRACT(MONTH FROM update_timestamp);
            """, (current_year,))

            monthly_stats = cur.fetchall()
            
            if monthly_stats:
                print(f"{'Month':<15} {'KM':<12} {'Cost (RSD)':<15}")
                print("-" * 80)
                for month, km, cost in monthly_stats:
                    print(f"{month.strip():<15} {km or 0:<12} {cost or 0:<15}")
            
            # Get fuel type breakdown
            print("\nFuel Type Breakdown:")
            print("-" * 80)
            cur.execute("""
                SELECT 
                    c.fuel_type,
                    SUM(COALESCE(cu.kilometers_driven, 0)) as total_km,
                    ROUND(SUM(COALESCE(cu.fuel_cost_for_update, 0))::numeric, 2) as total_cost
                FROM cars c
                LEFT JOIN car_updates cu ON c.id = cu.car_id
                WHERE EXTRACT(YEAR FROM cu.update_timestamp) = %s
                GROUP BY c.fuel_type
                ORDER BY total_cost DESC;
            """, (current_year,))

            fuel_stats = cur.fetchall()
            
            if fuel_stats:
                print(f"{'Fuel Type':<15} {'Total KM':<12} {'Total Cost (RSD)':<15}")
                print("-" * 80)
                for fuel_type, km, cost in fuel_stats:
                    print(f"{fuel_type:<15} {km or 0:<12} {cost or 0:<15}")

        except Exception as e:
            print(f"Database error: {e}")
            if conn:
                conn.rollback()
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

    except Exception as e:
        print(f"Configuration error: {e}")

if __name__ == "__main__":
    calculate_yearly_statistics()
