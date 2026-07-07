from pathlib import Path

import pandas as pd


# pandas is the main Python library for tabular data analysis.
# Think of a DataFrame as an Excel-like table that Python can calculate,
# filter, group, sort, and summarize.

pd.set_option("display.max_columns", 50)
pd.set_option("display.width", 140)


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_FILE = PROJECT_ROOT / "03_data" / "superstore.csv"


def section(title):
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def show_table(title, table, rows=10):
    section(title)
    print(table.head(rows))


# 1. Read the CSV file.
df = pd.read_csv(DATA_FILE)


# 2. Make column names easier to type in Python.
# Example: "Order Date" becomes "order_date"; "Sub-Category" becomes "sub_category".
df.columns = (
    df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_")
    .str.replace("-", "_")
)


# 3. Convert date columns from text into real date values.
df["order_date"] = pd.to_datetime(df["order_date"])
df["ship_date"] = pd.to_datetime(df["ship_date"])


# 4. Create new analysis columns.
df["ship_days"] = (df["ship_date"] - df["order_date"]).dt.days
df["profit_margin"] = df["profit"] / df["sales"]
df["order_month"] = df["order_date"].dt.to_period("M").astype(str)
df["is_loss_order"] = df["profit"] < 0


# 5. First look at the data.
section("Dataset overview")
print("Rows and columns:", df.shape)
print("\nColumns:")
print(df.columns.tolist())

show_table(
    "First 5 rows",
    df[
        [
            "order_date",
            "region",
            "category",
            "sub_category",
            "product_name",
            "sales",
            "quantity",
            "discount",
            "profit",
        ]
    ],
    rows=5,
)


# 6. Overall business numbers.
total_sales = df["sales"].sum()
total_profit = df["profit"].sum()
total_quantity = df["quantity"].sum()
average_profit_margin = total_profit / total_sales
loss_order_count = df["is_loss_order"].sum()

section("Overall business summary")
print(f"Total sales: ${total_sales:,.2f}")
print(f"Total profit: ${total_profit:,.2f}")
print(f"Total quantity sold: {total_quantity:,}")
print(f"Average profit margin: {average_profit_margin:.2%}")
print(f"Loss-making rows: {loss_order_count:,}")


# 7. Which category makes the most money?
category_summary = (
    df.groupby("category", as_index=False)
    .agg(
        sales=("sales", "sum"),
        profit=("profit", "sum"),
        quantity=("quantity", "sum"),
        average_discount=("discount", "mean"),
    )
    .assign(profit_margin=lambda x: x["profit"] / x["sales"])
    .sort_values("profit", ascending=False)
)

show_table(
    "Sales and profit by category",
    category_summary.round(
        {
            "sales": 2,
            "profit": 2,
            "average_discount": 3,
            "profit_margin": 3,
        }
    ),
)


# 8. Which region performs best?
region_summary = (
    df.groupby("region", as_index=False)
    .agg(
        sales=("sales", "sum"),
        profit=("profit", "sum"),
        quantity=("quantity", "sum"),
        average_ship_days=("ship_days", "mean"),
    )
    .assign(profit_margin=lambda x: x["profit"] / x["sales"])
    .sort_values("profit", ascending=False)
)

show_table(
    "Sales and profit by region",
    region_summary.round(
        {
            "sales": 2,
            "profit": 2,
            "average_ship_days": 2,
            "profit_margin": 3,
        }
    ),
)


# 9. Category x region pivot table.
category_region_profit = pd.pivot_table(
    df,
    index="category",
    columns="region",
    values="profit",
    aggfunc="sum",
    fill_value=0,
)

show_table("Profit pivot table: category x region", category_region_profit.round(2))


# 10. Top products by sales.
top_products_by_sales = (
    df.groupby(["product_name", "category", "sub_category"], as_index=False)
    .agg(
        sales=("sales", "sum"),
        profit=("profit", "sum"),
        quantity=("quantity", "sum"),
    )
    .assign(profit_margin=lambda x: x["profit"] / x["sales"])
    .sort_values("sales", ascending=False)
)

show_table(
    "Top 10 products by sales",
    top_products_by_sales.round({"sales": 2, "profit": 2, "profit_margin": 3}),
    rows=10,
)


# 11. Products that sell but lose money.
loss_products = (
    top_products_by_sales[top_products_by_sales["profit"] < 0]
    .sort_values("profit", ascending=True)
)

show_table(
    "Worst 10 products by profit",
    loss_products.round({"sales": 2, "profit": 2, "profit_margin": 3}),
    rows=10,
)


# 12. Does discount level affect profit?
df["discount_level"] = pd.cut(
    df["discount"],
    bins=[-0.01, 0, 0.2, 0.5, 1.0],
    labels=["no_discount", "low_discount", "medium_discount", "high_discount"],
)

discount_summary = (
    df.groupby("discount_level", observed=True)
    .agg(
        order_rows=("row_id", "count"),
        sales=("sales", "sum"),
        profit=("profit", "sum"),
        average_profit_margin=("profit_margin", "mean"),
    )
    .reset_index()
    .sort_values("profit", ascending=False)
)

show_table(
    "Profit by discount level",
    discount_summary.round(
        {
            "sales": 2,
            "profit": 2,
            "average_profit_margin": 3,
        }
    ),
)


# 13. Monthly trend.
monthly_summary = (
    df.groupby("order_month", as_index=False)
    .agg(
        sales=("sales", "sum"),
        profit=("profit", "sum"),
        quantity=("quantity", "sum"),
    )
    .assign(profit_margin=lambda x: x["profit"] / x["sales"])
    .sort_values("order_month")
)

show_table(
    "Monthly sales and profit trend",
    monthly_summary.round({"sales": 2, "profit": 2, "profit_margin": 3}),
    rows=12,
)


# 14. Customer segment performance.
segment_summary = (
    df.groupby("segment", as_index=False)
    .agg(
        sales=("sales", "sum"),
        profit=("profit", "sum"),
        quantity=("quantity", "sum"),
        customers=("customer_id", "nunique"),
    )
    .assign(
        profit_margin=lambda x: x["profit"] / x["sales"],
        sales_per_customer=lambda x: x["sales"] / x["customers"],
    )
    .sort_values("profit", ascending=False)
)

show_table(
    "Sales and profit by customer segment",
    segment_summary.round(
        {
            "sales": 2,
            "profit": 2,
            "profit_margin": 3,
            "sales_per_customer": 2,
        }
    ),
)


# 15. Simple data-driven conclusions.
best_category = category_summary.iloc[0]
worst_category = category_summary.iloc[-1]
best_region = region_summary.iloc[0]
worst_region = region_summary.iloc[-1]
worst_product = loss_products.iloc[0]

section("Simple conclusions")
print(
    f"Best category by profit: {best_category['category']} "
    f"(${best_category['profit']:,.2f})"
)
print(
    f"Weakest category by profit: {worst_category['category']} "
    f"(${worst_category['profit']:,.2f})"
)
print(
    f"Best region by profit: {best_region['region']} "
    f"(${best_region['profit']:,.2f})"
)
print(
    f"Weakest region by profit: {worst_region['region']} "
    f"(${worst_region['profit']:,.2f})"
)
print(
    f"Worst product by profit: {worst_product['product_name']} "
    f"(${worst_product['profit']:,.2f})"
)


section("Practice ideas")
print("1. Change the code to find the top 10 products by profit instead of sales.")
print("2. Change the code to analyze sub_category instead of category.")
print("3. Filter only one region, then rerun the same analysis.")
print("4. Find which month had the highest profit.")
print("5. Compare orders with discount and orders without discount.")
