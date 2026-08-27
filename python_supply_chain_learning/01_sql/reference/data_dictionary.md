# Olist 資料字典 — 9 張表的商業意義與 join 地圖

隨時可查的參考文件。表結構（欄位與型別）的正典定義在 [../setup_one_time/1_create_schema_and_tables.sql](../setup_one_time/1_create_schema_and_tables.sql) 的 DDL（建表語句）裡；這份文件負責講**商業意義**：每張表是誰、為什麼重要、跟誰用什麼鍵串接。

背景：Olist 是巴西的電商市集（marketplace）資料集，可以回答訂單、客戶、商品、賣家、付款、評價與交付績效的問題。所有表都在 schema（資料庫資料夾）`olist` 底下，表名以 `_raw` 結尾表示「原始資料，最小清理」。

---

## 9 表總覽

| 表 | 一列代表什麼 | 分析角色 | 筆數（2026-06-13） |
|---|---|---|---:|
| `olist.orders_raw` | 一筆訂單＋生命週期時間戳 | **主表**：訂單狀態與交付時間軸 | 99,441 |
| `olist.order_items_raw` | 訂單裡的一個品項 | 金額在這裡：商品、賣家、價格、運費 | 112,650 |
| `olist.customers_raw` | 一筆客戶紀錄＋所在地 | 把訂單接到城市/州 | 99,441 |
| `olist.order_payments_raw` | 一筆付款紀錄 | 付款方式、分期、金額 | 103,886 |
| `olist.order_reviews_raw` | 一筆客戶評價 | 營運表現 vs 客戶滿意度 | 99,224 |
| `olist.products_raw` | 一個商品＋屬性 | 品類、尺寸重量 | 32,951 |
| `olist.product_category_translation_raw` | 一組葡→英品類名對照 | 對照表（lookup table），讓品類分析可讀 | 71 |
| `olist.sellers_raw` | 一個賣家＋所在地 | 賣家績效與賣家地區分析 | 3,095 |
| `olist.geolocation_raw` | 一個郵遞區號層級的座標點 | 地理參考；**最大的表，探索必帶 LIMIT** | 1,000,163 |

---

## 逐表說明

### orders_raw — 訂單主表

- **商業意義**：一列 = 一筆訂單及其生命週期時間戳（下單、核准、交給物流、送達客戶、預計送達）。
- **為什麼是分析師的第一張表**：多數電商問題從訂單出發 — 這張表串起客戶、訂單狀態、購買日期、實際送達與預計送達。你算 OTD（準時交貨率）需要的一切時間欄都在這裡。
- **重要欄位**：
  - `order_id` — 接品項、付款、評價的單號。
  - `customer_id` — 接客戶所在地。
  - `order_status` — delivered、canceled、shipped 等業務狀態（注意：canceled 一個 L）。
  - `order_purchase_timestamp` — 下單時間。
  - `order_delivered_customer_date` — 客戶實際收到的時間。
  - `order_estimated_delivery_date` — 預計送達日。

### order_items_raw — 訂單明細（錢在這裡）

- **商業意義**：一列 = 訂單中的一個品項。
- **為什麼重要**：一筆訂單可以有多個品項，所以這張表的列數比 orders_raw 多（11.2 萬 vs 9.9 萬）— 這正是 SAP 裡「單據抬頭 vs 單據明細」的關係。商品、賣家、價格、運費分析都靠它；**orders_raw 沒有金額欄，營收一定要接這張表**。
- **重要欄位**：
  - `order_id` — 把品項接回訂單。
  - `product_id` — 接商品明細。
  - `seller_id` — 接賣家明細。
  - `price` — 商品售價。
  - `freight_value` — 運費。

### customers_raw — 客戶

- **商業意義**：一列 = 一筆客戶紀錄與其所在地。
- **為什麼重要**：讓分析師把訂單接到客戶的城市與州 — 州別交付績效、州別營收都從這裡來。
- **重要欄位**：
  - `customer_id` — 接 `olist.orders_raw`。
  - `customer_unique_id` — 辨識跨訂單的「同一個真實客戶」（`customer_id` 每筆訂單都不同）。
  - `customer_state` — 州別分析的關鍵欄。

### order_payments_raw — 付款

- **商業意義**：一列 = 訂單的一筆付款紀錄。
- **為什麼重要**：分析付款方式、分期數與付款金額。一筆訂單可能拆多筆付款（所以列數比訂單多）。
- **重要欄位**：`order_id`（接回訂單）、`payment_type`（付款方式）、`payment_installments`（分期）、`payment_value`（金額）。

### order_reviews_raw — 評價

- **商業意義**：一列 = 客戶對一筆訂單的評價。
- **為什麼重要**：把營運表現（例如遲交）和客戶滿意度接起來 — 「遲到的訂單評分是不是比較低？」這類題目靠它。
- **重要欄位**：`order_id`（接回訂單）、`review_score`（1–5 分）、`review_creation_date`。

### products_raw — 商品

- **商業意義**：一列 = 一個商品及其屬性。
- **為什麼重要**：需要品類或尺寸/重量屬性時，把它接到 order_items_raw。
- **重要欄位**：`product_id`（接品項）、`product_category_name`（葡萄牙文品類名，接翻譯表）。
- **注意**：原始 CSV 把 length 拼成 `lenght`（如 `product_name_lenght`）— 表保留原拼法讓匯入對得上，查詢時照打錯字才找得到欄位。

### product_category_translation_raw — 品類翻譯

- **商業意義**：一列 = 一個葡萄牙文品類名對應英文品類名。
- **為什麼重要**：原始品類名是葡萄牙文，這張 lookup table（對照表）讓品類分析結果讀得懂 — 就像 Excel 裡放一張 VLOOKUP 用的對照表。注意：不是每個品類都有翻譯，所以 Chapter 4 會用 LEFT JOIN＋COALESCE 接它。

### sellers_raw — 賣家

- **商業意義**：一列 = 一個賣家及其所在地。
- **為什麼重要**：賣家層級績效、賣家地區分析時，把它接到 order_items_raw。
- **重要欄位**：`seller_id`（接品項）、`seller_state`。

### geolocation_raw — 地理座標

- **商業意義**：一列 = 一個郵遞區號層級的座標點。
- **為什麼重要**：可支援地理分析，但不是先研究的表 — 它非常大（100 萬列）且跟訂單績效的關聯較間接。**探索它必帶 LIMIT 或彙總。**

---

## Join（表格串接）地圖

**SAP 類比**：JOIN 就是你在 SAP 做過無數次的事 — 用單號把採購單**抬頭**（訂了什麼時候、什麼狀態）和**明細**（每個料號、數量、金額）接起來。這裡的單號是 `order_id`：orders_raw 是抬頭，order_items_raw 是明細。

### 關係圖

```text
                              customers_raw
                                    │ customer_id
                                    │
 order_payments_raw ── order_id ── orders_raw ── order_id ── order_reviews_raw
（付款，1 單可多筆）                 │（訂單抬頭）              （評價）
                                    │ order_id
                                    │
                             order_items_raw（訂單明細：價格、運費）
                              │            │
                   product_id │            │ seller_id
                              │            │
                       products_raw     sellers_raw
                              │
        product_category_name │
                              │
              product_category_translation_raw（品類葡→英對照表）

 geolocation_raw：獨立的郵遞區號參考表（zip_code_prefix 對應座標），課程主線不強制串接
```

### Join key 對照表

| 從 | 接到 | Join key（串接鍵） | 關係 |
|---|---|---|---|
| `orders_raw` | `customers_raw` | `customer_id` | 一單對一客戶紀錄 |
| `orders_raw` | `order_items_raw` | `order_id` | 一對多（抬頭 → 明細） |
| `order_items_raw` | `products_raw` | `product_id` | 多對一（明細 → 商品主檔） |
| `products_raw` | `product_category_translation_raw` | `product_category_name` | 多對一 lookup（建議 LEFT JOIN） |
| `order_items_raw` | `sellers_raw` | `seller_id` | 多對一（明細 → 賣家主檔） |
| `orders_raw` | `order_payments_raw` | `order_id` | 一對多（一單可多筆付款） |
| `orders_raw` | `order_reviews_raw` | `order_id` | 一單通常一評價（可能缺） |

### 三條最常走的路

1. **營收路線**（Chapter 2–4）：`orders_raw` ─`order_id`→ `order_items_raw` ─`product_id`→ `products_raw` ─`product_category_name`→ `translation`。老闆問「已送達訂單的總營收、前 20 大品類」走這條。
2. **地區路線**（ch05）：`orders_raw` ─`customer_id`→ `customers_raw`，取 `customer_state` — 各州交期、各州準時率。
3. **滿意度/金流路線**：`orders_raw` ─`order_id`→ `order_payments_raw` 或 `order_reviews_raw` — 付款方式結構、遲交與評分的關係。
