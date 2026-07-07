# Python Cheat Sheet

Add only concepts you have practiced. Do not turn this into a textbook.

## Print

`print()` is an output function（輸出函數）. It shows information on the screen.

```python
product_name = "Keyboard"
print("Product:", product_name)
```

Rule: text labels go inside quotation marks; variable names do not.

## Variables

```python
product_name = "Laptop"
unit_cost = 500
inventory_quantity = 20
total_value = unit_cost * inventory_quantity
print(total_value)
```

Rule: variable names must be spelled exactly the same every time.

## Strings and Integers

```python
product_name = "Keyboard"
unit_price = 45
```

Rule: text uses quotation marks. Whole numbers do not use quotation marks.

## Assignment

```python
unit_price = 45
```

Rule: `=` stores the value on the right into the variable name on the left.

## Multiplication

```python
total_revenue = unit_price * units_sold
```

Rule: `*` means multiplication in Python.

## NameError

```python
unit_price = 45
print(units_price)
```

Rule: this fails because `units_price` and `unit_price` are different names.

## If / Else

```python
inventory_quantity = 8
reorder_point = 10

if inventory_quantity < reorder_point:
    print("Reorder needed")
else:
    print("Inventory is enough")
```

Rule: indentation matters in Python.

## For Loop

```python
items = ["laptop", "monitor", "keyboard"]

for item in items:
    print(item)
```

Rule: use a loop when the same action should happen to each item.
