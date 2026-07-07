# Day 1 Practice (fill-in): Inventory Cost Calculator
# Business problem: calculate the total inventory value of one product.
# Formula: total_inventory_value = unit_cost * inventory_quantity
#
# Practice data:
#   product:    Mouse
#   unit_cost:  12
#   quantity:   60
#   expected:   720
#
# Rule: text needs quotation marks "...", numbers do not.
# ---------------------------------------------------

# Step 1: create the 4 variables (fill the value on the right of each =)
product_name = "mouse"
unit_cost = 12
inventory_quantity = 60

# Step 2: calculate the total inventory value with *
total_inventory_value = unit_cost * inventory_quantity

# Step 3: print the results with print() (keep the colons consistent)
print("Product:", product_name)
print("Unit cost:", unit_cost)
print("Inventory quantity:", inventory_quantity)
print("Total inventory value:", total_inventory_value)

# Step 4: save, then run from the repo root in Terminal:
#   python3 01_lessons/week_01_basics/day1_inventory_cost/2_practice.py
