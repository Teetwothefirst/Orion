# ORION AGRICULTURAL MARKETPLACE
## Product Requirements Document - Executive Version

**Version:** 1.0  
**Date:** February 12, 2026  
**Target Launch:** June 2026 (Abuja, FCT, Nigeria)  
**Classification:** CONFIDENTIAL & PROPRIETARY

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Complete Product Specifications](#complete-product-specifications)
3. [System Architecture Overview](#system-architecture-overview)
4. [User Experience Flows](#user-experience-flows)
5. [Development Roadmap](#development-roadmap)
6. [Go-to-Market Strategy](#go-to-market-strategy)
7. [Financial Projections](#financial-projections)
8. [Success Metrics](#success-metrics)
9. [Risk Management](#risk-management)

---

## EXECUTIVE SUMMARY

### The Vision

Orion is Nigeria's first AI-powered agricultural marketplace that combines conversational commerce with secure escrow payments. Farmers and buyers discover products, negotiate, and transact entirely through natural language in **English, Hausa, Yoruba, Igbo, and Nigerian Pidgin**.

### The Problem We Solve

Nigeria's ₦200+ billion agricultural sector suffers from:

1. **Digital Literacy Barriers** - Complex forms exclude 60% of farmers
2. **Language Barriers** - English-only platforms miss 70% of rural farmers  
3. **Trust Deficit** - No payment protection; 40% report being cheated
4. **Regional Terminology** - "Ọka" (Igbo) ≠ "Masara" (Hausa) ≠ "Corn" in search
5. **Fragmented Markets** - Buyers can't find sellers 10km away

### Our Solution - Three Core Innovations

**1. Conversational AI Interface**
- Users speak or type naturally: "I need 50kg of fertilizer in Gwagwalada"
- AI understands intent, searches database, presents results as product cards
- No forms, no menus, no complexity

**2. Semantic Search Engine**
- Products stored as mathematical "meaning representations"
- Search for "ọka" (Igbo) → automatically finds "maize", "corn", "masara" (Hausa)
- Handles spelling variations, regional dialects, synonyms

**3. In-Chat Escrow System**
- Buyer pays → Funds held 48 hours → Seller ships → Buyer confirms → Payment released
- Protects buyers from low quality; guarantees sellers get paid
- Disputes resolved by AI (simple cases) or humans (complex cases)

### Market Opportunity

| Metric | Value |
|--------|-------|
| **Year 1 Target Market** | Abuja (FCT) - 180,000 farmers & buyers |
| **Year 1 Penetration Goal** | 20,000 users (11%) |
| **Projected Year 1 GMV** | ₦600 million (~$360K USD) |
| **Revenue Model** | 3-5% transaction fees + vendor subscriptions |
| **Break-Even Target** | Month 7 (₦3.6M monthly revenue) |
| **Year 1 Net Profit** | ₦4.4M after break-even |

### Why Abuja First?

- ✅ High purchasing power (government workers, stable incomes)
- ✅ All major languages spoken (perfect for multilingual AI testing)
- ✅ Compact (6 area councils vs Lagos's 20+ LGAs)
- ✅ Active farming periphery (Gwagwalada, Kuje, Kwali, Bwari)
- ✅ Founder presence (enables rapid iteration)
- ✅ Natural expansion routes (Niger, Nasarawa, Kogi states nearby)

---

## COMPLETE PRODUCT SPECIFICATIONS

### MVP Scope Definition

**What's INCLUDED in MVP:**
- ✅ Conversational AI search (text + voice) in 5 languages
- ✅ Product listing via natural language (no forms)
- ✅ In-chat payment with Paystack escrow
- ✅ Order status tracking (Pending → Paid → Shipped → Delivered → Completed)
- ✅ Dispute resolution system with photo evidence
- ✅ Rating & review system (1-5 stars + text)
- ✅ Push notifications for order updates
- ✅ Vendor verification badges (Phone → Address → Gold)

**What's EXCLUDED from MVP (Future Phases):**
- ❌ Logistics partner integration (vendors arrange delivery initially)
- ❌ Advanced analytics dashboard (basic stats only)
- ❌ API for external systems
- ❌ Web version (mobile-only for MVP)
- ❌ Direct buyer-seller chat (AI mediates all communication)
- ❌ Recommendation engine
- ❌ Credit/financing options

**Initial Product Categories (13 Products):**

**SEEDS:**
1. Maize/corn seeds
2. Rice seeds
3. Bean seeds (various varieties)
4. Vegetable seeds (tomato, pepper, onion)
5. Cassava stems/cuttings

**FOODSTUFFS:**
6. Rice (local & foreign)
7. Beans (brown, white, honey beans)
8. Garlic & Onions
9. Tomatoes (fresh)
10. Pepper (fresh & dried)
11. Yam (tubers)
12. Cassava/Garri

**Rationale:** High-frequency purchases, clear quality standards, attract both farmer-buyers and household buyers.

---

### Feature 1: CONVERSATIONAL AI SEARCH & DISCOVERY

**User Story:**  
*"As a buyer, I want to find agricultural products by speaking or typing naturally in my language, without navigating menus or filling forms."*

#### Core Capabilities

**Input Methods:**
- Text input (typing)
- Voice notes (up to 60 seconds)
- Supports: English, Hausa, Yoruba, Igbo, Nigerian Pidgin

**How It Works:**

1. **User sends message:** "Ina son NPK fertilizer 50kg a Gwagwalada" (Hausa)

2. **AI Processing:**
   - Detects language → Hausa
   - Extracts intent → BUY_PRODUCT
   - Extracts entities → product="NPK fertilizer", quantity="50kg", location="Gwagwalada"

3. **Semantic Search:**
   - Converts query to mathematical representation
   - Searches vector database for similar meanings
   - Finds "NPK", "nitrogen fertilizer", "farm fertilizer" (synonyms)
   - Filters by location (within 50km of Gwagwalada)

4. **Database Query:**
   - Retrieves full product details (price, photos, seller info)
   - Ranks by: Relevance (40%) + Distance (25%) + Rating (20%) + Sales History (15%)

5. **Response Generation:**
   - AI responds in Hausa: "Na sami 4 options kusa da Gwagwalada..." (Found 4 options near Gwagwalada)
   - Displays product cards with photos, prices, seller ratings

#### Product Card Display

```
┌─────────────────────────────────┐
│ [Product Photo]                 │
│                                 │
│ NPK 15-15-15 Fertilizer         │
│ ₦18,500 (50kg bag)              │
│                                 │
│ 📍 Emeka Agro - 2.3km away      │
│ ⭐ 4.7 stars (23 reviews)       │
│ ✅ Phone Verified               │
│                                 │
│ [View Details]  [Message Seller]│
│ [Buy Now]                       │
└─────────────────────────────────┘
```

#### Performance Requirements

| Requirement | Target |
|-------------|--------|
| Response time (text query) | < 3 seconds |
| Response time (voice query) | < 5 seconds |
| Language detection accuracy | 95%+ |
| Cross-language search accuracy | "ọka" finds "maize"/"corn" 90%+ of time |
| Voice transcription accuracy (Hausa) | 90%+ |
| Concurrent users supported | 1,000+ simultaneous |

#### Success Criteria

- [ ] User can search in any of 5 languages without switching settings
- [ ] Voice input in Hausa transcribed accurately 90%+ of the time
- [ ] Search for "ọka" returns products listed as "maize", "corn", "masara"
- [ ] Results load in <3 seconds on 3G connection
- [ ] AI handles unclear queries with clarifying questions

---

### Feature 2: PRODUCT LISTING & INVENTORY MANAGEMENT

**User Story:**  
*"As a farmer, I want to list products by simply describing them in my language, without filling complex forms."*

#### Listing Creation Process

**Step-by-Step Flow:**

1. **Vendor initiates:** "I want to sell 200kg of tomatoes at ₦400/kg in Kuje"

2. **AI extracts details:**
   - Product: Tomatoes
   - Quantity: 200kg
   - Price: ₦400/kg
   - Location: Kuje

3. **Photo requirement:**
   - AI: "Great! Please take a photo of the tomatoes."
   - Vendor uploads 1-5 photos

4. **Preview & confirmation:**
   ```
   🍅 Fresh Tomatoes
   ₦400/kg (200kg available)
   📍 Kuje, Abuja
   [Photo preview]
   
   Is this correct?
   [Yes, Publish] [Edit Details]
   ```

5. **Go live:**
   - AI: "✅ Your tomatoes are now live!"
   - Product appears in search within 30 seconds
   - Vendor receives confirmation notification

#### Listing Management

**Stock Updates:**
- After sale: AI asks "You sold 50kg. Update listing to 150kg?" → [Yes] [No] [Custom]
- Out of stock: Automatically hidden from search, visible in vendor dashboard
- Re-stock: Vendor can update quantity to make visible again

**Editing:**
- Change price: "Update price to ₦450/kg"
- Add photos: "Add more photos"
- Update description: "This is premium grade tomatoes"

**Deletion:**
- "Delete my tomato listing" → Removed permanently
- "Mark as sold out" → Hidden but recoverable

#### Product Data Structure

**Required Fields:**
- Product name
- Category (auto-detected from description)
- Price
- Unit (kg, bag, piece)
- Quantity available
- Location (GPS coordinates + name)
- Photos (minimum 1, maximum 5)

**Optional Fields:**
- Product grade (Premium, Standard, Economy)
- Description (additional details)
- Delivery options
- Bulk discounts

#### Photo Requirements

**Quality Guidelines:**
- Well-lit (preferably natural daylight)
- Clear focus (not blurry)
- Shows actual product (not stock photos)
- Include scale reference when possible

**Technical Specs:**
- Format: JPEG, PNG, WebP
- Max size: 5MB per photo
- Auto-compressed to WebP (50% smaller)
- Thumbnails generated: 100px, 400px, 800px

#### Performance Requirements

| Requirement | Target |
|-------------|--------|
| Listing creation time | < 2 minutes |
| Photo upload time (3G) | < 30 seconds per photo |
| Time until searchable | < 30 seconds after publish |
| Inventory update processing | Real-time (<5 seconds) |

#### Success Criteria

- [ ] Vendor can list product in <2 minutes using voice
- [ ] Photo upload works on slow connections (3G, 512kbps)
- [ ] Product appears in search results within 30 seconds
- [ ] Out-of-stock products hidden from buyers but visible to vendor
- [ ] 80%+ of listings have "good" quality photos

---

### Feature 3: IN-CHAT PAYMENT & ESCROW

**User Story:**  
*"As a buyer, I want to pay securely and have my money protected until I confirm delivery."*

#### Payment Flow Overview

**11-Step Process:**

1. **Checkout Initiation**
   - Buyer taps "Buy Now" on product card
   - AI generates order summary with total

2. **Payment Method Selection**
   - Card (Visa/Mastercard/Verve)
   - Bank Transfer
   - USSD (*737# codes)
   - Mobile Money (MTN, Airtel)

3. **Payment Processing**
   - Redirect to Paystack secure payment page
   - Buyer enters payment details
   - Payment confirmed instantly

4. **Escrow Hold**
   - Funds deposited to Orion's Paystack account
   - Status: HELD (not yet released to seller)
   - Buyer notified: "✅ Payment received!"
   - Seller notified: "🔔 New order!"

5. **Delivery Preparation**
   - Seller prepares goods
   - Marks order as "Shipped" in app

6. **Escrow Timer Starts**
   - 48-hour countdown begins when seller marks "Shipped"
   - Buyer notified: "Your order is on the way"

7. **Delivery Occurs**
   - Seller delivers goods to buyer
   - Buyer inspects quality

8. **Delivery Confirmation**
   - AI asks buyer: "Did you receive your order in good condition?"
   - Options: [✅ Yes, Release Payment] [❌ No, I have an issue]

9a. **Happy Path - Immediate Release**
   - Buyer confirms → Escrow released immediately
   - Seller receives payment in wallet
   - Order marked: COMPLETED

9b. **Issue Path - Dispute**
   - Buyer reports issue → Dispute process begins
   - Escrow remains held until resolution

10. **Auto-Release (No Response)**
    - If buyer doesn't respond within 48 hours
    - Escrow automatically released to seller
    - Assumes delivery was successful

11. **Withdrawal**
    - Seller can withdraw funds to bank account
    - Processing time: Same day (if before 3pm), next day (after 3pm)

#### Order Summary Display

```
┌─────────────────────────────────┐
│ 🛒 ORDER SUMMARY                │
│                                 │
│ NPK 15-15-15 Fertilizer         │
│ 50kg bag × 2                    │
│                                 │
│ Subtotal:        ₦37,000        │
│ Delivery:         ₦2,000        │
│ ─────────────────────────       │
│ TOTAL:           ₦39,000        │
│                                 │
│ Seller: Emeka Agro              │
│ Delivery: 2-3 days              │
│                                 │
│ [💳 Pay with Card]              │
│ [🏦 Bank Transfer]              │
│ [📱 USSD]                       │
└─────────────────────────────────┘
```

#### Order Status Tracking

**Status Flow:**

```
PENDING_PAYMENT
    ↓ (buyer pays)
PAID (escrow held)
    ↓ (seller ships)
SHIPPED (48hr timer starts)
    ↓ (buyer confirms OR 48hrs pass)
DELIVERED
    ↓
COMPLETED (payment released)
```

**Alternative Paths:**
- REFUNDED (dispute resolved in buyer's favor)
- DISPUTED (complaint filed, under review)
- CANCELLED (before payment)

#### Fee Structure

**Transaction Fees:**

| Vendor Tier | Monthly Fee | Transaction Fee | Best For |
|-------------|-------------|-----------------|----------|
| **Free** | ₦0 | 5% | New sellers, testing |
| **Vendor Plus** | ₦5,000/mo | 3% | Regular sellers (10+ sales/month) |
| **Vendor Pro** | ₦15,000/mo | 2% | High-volume (50+ sales/month) |

**Example Calculation (₦39,000 order):**

```
Buyer pays:           ₦39,000

Paystack fee:         -₦685 (1.5% + ₦100)
Orion fee (5%):       -₦1,850 (5% of ₦37,000 product value)

Seller receives:      ₦36,465 (93.5% of total)
```

**Fee Breakdown:**
- Delivery fee goes 100% to seller (not subject to platform fee)
- Platform fee calculated on product value only
- Paystack fee absorbed by seller (industry standard)

#### Payment Security

**Protection Mechanisms:**

1. **PCI-DSS Compliance**
   - Paystack handles all card data
   - Orion never stores card numbers or CVV

2. **Webhook Verification**
   - All payment notifications cryptographically signed
   - Invalid signatures rejected

3. **Two-Factor Authentication**
   - Phone verification required for withdrawals over ₦50,000

4. **Fraud Detection**
   - Pattern monitoring (unusual transaction volumes)
   - Automatic holds on suspicious accounts
   - Manual review for high-value transactions

#### Performance Requirements

| Requirement | Target |
|-------------|--------|
| Payment processing time | < 60 seconds |
| Escrow hold reliability | 99.9% accuracy |
| Auto-release execution | Within 5 minutes of 48hr mark |
| Withdrawal processing | Same day (if before 3pm) |
| Payment notification delivery | < 10 seconds |

#### Success Criteria

- [ ] Payment completes in <60 seconds on stable connection
- [ ] Buyer receives instant payment confirmation
- [ ] Seller receives order notification within 10 seconds
- [ ] Escrow never releases before buyer confirmation or 48hrs
- [ ] 95%+ payment success rate (excluding user error)
- [ ] Zero security breaches or payment fraud

---

### Feature 4: DISPUTE RESOLUTION & QUALITY ASSURANCE

**User Story:**  
*"As a buyer, I want to file complaints about wrong or poor-quality products and get fair resolution."*

#### Complaint Categories

1. **Wrong Item** - Received different product than ordered
2. **Poor Quality** - Substandard, damaged, or spoiled
3. **Wrong Quantity** - Received less than ordered
4. **Damaged Goods** - Packaging damaged, product broken
5. **Never Arrived** - No delivery made

#### Dispute Process Flow

**Step 1: Filing Complaint (Buyer)**

1. Buyer opens completed order
2. AI asks: "Did you receive your order in good condition?"
3. Buyer taps: "No, I have an issue"
4. Selects complaint category: "Wrong Quantity"
5. Provides details: "Received 80kg instead of 100kg"
6. Uploads evidence photos (required for quality/quantity issues)
7. AI confirms: "Complaint filed. Seller has 24 hours to respond."

**Step 2: Seller Response**

Seller receives notification with:
- Complaint type
- Buyer's description
- Evidence photos

**Seller Options:**
- **Send Missing Quantity** - "I'll send the remaining 20kg today"
- **Offer Partial Refund** - Proposes ₦9,000 refund (20%)
- **Dispute Claim** - "The quantity was correct, here's my photo proof"
- **Message Buyer** - Negotiate directly

**Step 3: Resolution**

**Option A: Mutual Agreement**
- Seller offers ₦9,000 partial refund
- Buyer accepts
- System executes:
  - ₦9,000 → Buyer (refund)
  - ₦36,000 → Seller (remaining payment)
- Dispute closed

**Option B: AI Mediation (Simple Cases)**
- For quantity disputes with clear math
- AI calculates pro-rata refund automatically
- Example: 20kg shortage on 100kg order = 20% refund
- Both parties presented with calculation
- Accept/Decline

**Option C: Human Escalation (Complex Cases)**
- Either party rejects AI proposal
- Case escalated to human mediator
- Review period: 48 hours
- Mediator reviews all evidence
- Makes binding decision:
  - Full refund + seller warning
  - Partial refund (custom amount)
  - No refund + buyer warning (if frivolous)
  - Replacement (seller sends new goods)

#### Vendor Verification System

**Badge Levels:**

| Badge | Requirement | Display | Trust Signal |
|-------|-------------|---------|--------------|
| **Green Badge** | Phone verified via OTP | ✅ Phone Verified | Basic credibility |
| **Blue Badge** | Physical address verified (video call or field visit) | 🏠 Address Verified | Higher trust |
| **Gold Badge** | 50+ sales, 4.5+ rating, <5% dispute rate | ⭐ Trusted Seller | Premium trust |

**Verification Process:**

1. **Phone (Automatic):**
   - SMS OTP sent during signup
   - Must verify to list products

2. **Address (Manual):**
   - Vendor submits address + business photo
   - Option 1: Video call verification (10 min)
   - Option 2: Field agent visit (scheduled)
   - Processing time: 48 hours

3. **Gold (Earned):**
   - Automatically awarded when criteria met
   - Reviewed monthly (can lose badge if performance drops)

#### Strike System

**How It Works:**

- **1st Unresolved Complaint:** Warning notification
- **2nd Unresolved Complaint:** Warning + email
- **3rd Unresolved Complaint:** 7-day suspension (can't list new products)
- **5th Unresolved Complaint:** Permanent ban

**"Unresolved" Definition:**
- Mediation ruled against seller
- Seller ignored complaint for 24+ hours
- Pattern of similar complaints (3+ for same issue)

**"Resolved" (No Penalty):**
- Buyer accepted seller's offer
- Mediation ruled in seller's favor
- Complaint withdrawn by buyer

**Appeal Process:**
- Suspended vendors can appeal within 48 hours
- Founder reviews appeal within 72 hours
- Reinstatement possible if evidence supports seller

#### Buyer Protection Fund

**Purpose:** Cover clear fraud cases where seller disappears

**Funding:** 1% of each transaction goes to protection fund

**Usage:**
- Seller account deleted/banned before delivery
- Seller provided completely different product (scam)
- Seller unreachable for 7+ days

**Maximum Claim:** ₦50,000 per incident

#### Performance Requirements

| Requirement | Target |
|-------------|--------|
| Complaint filing time | < 2 minutes |
| Evidence photo upload | < 30 seconds per photo |
| Seller notification delivery | < 5 minutes |
| AI mediation calculation | < 10 seconds |
| Human mediation response | < 48 hours |
| Dispute resolution rate | 80%+ without escalation |

#### Success Criteria

- [ ] Buyer can file complaint with photos within 48 hours of delivery
- [ ] Seller notified within 5 minutes
- [ ] AI correctly calculates pro-rata refunds for quantity disputes
- [ ] 80%+ disputes resolved without human escalation
- [ ] Human mediator responds within 48 hours
- [ ] Dispute rate stays below 5% of total transactions

---

### Feature 5: RATING & REVIEW SYSTEM

**User Story:**  
*"As a buyer, I want to rate sellers after transactions so others can make informed decisions."*

#### Review Collection Process

**Trigger:** After buyer confirms delivery

**Flow:**

1. AI: "Great! Payment has been released to [Seller Name]. How was your experience?"

2. **Rating Selection:**
   ```
   ⭐⭐⭐⭐⭐  (5 stars)
   Tap to rate:
   ```

3. **Optional Text Review:**
   ```
   Want to add a comment? (optional, 200 characters max)
   
   [___________________________________]
   
   Examples:
   • "Fast delivery, good quality"
   • "Product as described, recommend!"
   • "Delivery was late but quality good"
   
   [Skip] [Submit Review]
   ```

4. **Confirmation:**
   - AI: "Thank you! Your review helps other farmers."
   - Vendor notified: "🌟 You received a [X]-star review from [Buyer]!"

#### Vendor Profile Display

**Profile Card:**

```
┌─────────────────────────────────────┐
│ EMEKA AGRO                          │
│ ⭐ 4.7 stars (23 reviews)          │
│                                     │
│ ✅ Phone Verified                   │
│ 🏠 Address Verified                 │
│ ⭐ Trusted Seller                   │
│                                     │
│ 📊 Response rate: 98%               │
│ 🚚 Avg delivery: 2 days             │
│ 📦 Completed sales: 67              │
│                                     │
│ ─────────────────────────────────  │
│ RECENT REVIEWS                      │
│                                     │
│ ⭐⭐⭐⭐⭐ Chidi O. (2 days ago)    │
│ "Fast delivery, good quality..."   │
│ 👤 Emeka: "Thank you for your      │
│    business!"                       │
│                                     │
│ ⭐⭐⭐⭐ Ada N. (1 week ago)       │
│ "Good product but delivery..."     │
│ 👤 Emeka: "Sorry for delay,        │
│    will improve!"                   │
│                                     │
│ ⭐⭐⭐⭐⭐ Bola S. (2 weeks ago)   │
│ "Excellent service, highly..."     │
│                                     │
│ [See all 23 reviews]               │
└─────────────────────────────────────┘
```

#### Review Moderation

**Automatic Checks:**

1. **Profanity Filter**
   - Scans for inappropriate language
   - Flags reviews containing profanity
   - Requires human approval before publishing

2. **Hate Speech Detection**
   - Identifies potentially defamatory content
   - Keywords: "scam", "fraud", "thief", "419", etc.
   - Flagged for review (not auto-rejected)

3. **Spam Detection**
   - Reviews with same text from multiple accounts
   - Reviews with external links
   - Automatically hidden

**Human Moderation:**
- Flagged reviews reviewed within 24 hours
- Approved → Published immediately
- Rejected → Buyer notified with reason
- Borderline → Edited version suggested to buyer

**Moderation Guidelines:**

✅ **Allowed:**
- Honest opinions (even negative)
- Constructive criticism
- Factual complaints
- Personal experiences

❌ **Not Allowed:**
- Personal attacks
- Threats or harassment
- False accusations without evidence
- Profanity or hate speech
- Reviews from non-buyers (fake reviews)

#### Vendor Response

**Seller Can Reply:**
- 1 response per review
- Maximum 150 characters
- Must remain professional (moderated)
- Response appears below review

**Best Practices (Shown to Vendors):**
- Thank positive reviewers
- Apologize for issues
- Explain what you'll improve
- Keep it brief and professional

**Example Responses:**

Good:
- "Thank you for your business! We appreciate your feedback."
- "Sorry for the delay. We're working on faster delivery."
- "Glad you liked the product! Come again."

Bad (Would Be Flagged):
- "You're lying, I sent the right quantity!"
- "This review is fake, report this person!"
- Long explanations (over 150 characters)

#### Rating Impact on Search

**Ranking Algorithm:**

Products ranked by combined score:
- **Semantic Relevance:** 35%
- **Distance from Buyer:** 25%
- **Vendor Rating:** 20%
- **Transaction History:** 15%
- **Listing Freshness:** 5%

**Example:**
- 5-star vendor (Product A) vs 3-star vendor (Product B)
- Same relevance, same distance
- Product A ranks higher due to 20% rating boost

#### Analytics for Vendors

**Dashboard Shows:**
- Average rating (1 decimal place)
- Total reviews received
- Rating distribution (5★: 15, 4★: 6, 3★: 2, 2★: 0, 1★: 0)
- Recent reviews (last 5)
- Response rate (% of reviews you replied to)
- Rating trend (improving/declining over 3 months)

#### Performance Requirements

| Requirement | Target |
|-------------|--------|
| Review submission time | < 30 seconds |
| Rating calculation update | < 5 seconds |
| Moderation response time | < 24 hours |
| Vendor notification delivery | < 10 seconds |

#### Success Criteria

- [ ] Review prompt appears immediately after delivery confirmation
- [ ] Vendor average rating updates within 5 seconds
- [ ] Profane reviews flagged 100% of the time
- [ ] 70%+ of buyers leave reviews
- [ ] Vendors respond to 50%+ of reviews
- [ ] Higher-rated vendors appear first in search (other factors equal)

---

## SYSTEM ARCHITECTURE OVERVIEW

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │   Mobile     │     │   Mobile     │     │   Mobile     │  │
│  │  App (iOS)   │     │ App (Android)│     │  App (Web    │  │
│  │   Flutter    │     │   Flutter    │     │  Future)     │  │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘  │
│         │                    │                    │           │
│         └────────────────────┼────────────────────┘           │
│                              │                                │
└──────────────────────────────┼────────────────────────────────┘
                               │
                               │ HTTPS / REST API
                               │
┌──────────────────────────────▼────────────────────────────────┐
│                     APPLICATION LAYER                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           API GATEWAY (FastAPI Backend)                 │ │
│  │                                                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │  Auth    │  │  Chat    │  │ Products │  │Payments│ │ │
│  │  │  API     │  │  API     │  │   API    │  │  API   │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │ │
│  │                                                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │ Orders   │  │ Disputes │  │ Reviews  │  │Webhooks│ │ │
│  │  │  API     │  │   API    │  │   API    │  │  API   │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬───────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐   ┌──────────▼──────────┐   ┌──────▼──────┐
│   AI SERVICES  │   │   BUSINESS LOGIC    │   │  EXTERNAL   │
│                │   │                     │   │  SERVICES   │
│ ┌────────────┐ │   │ ┌─────────────────┐ │   │             │
│ │ Language   │ │   │ │ Escrow Manager  │ │   │ ┌─────────┐ │
│ │ Detection  │ │   │ └─────────────────┘ │   │ │Paystack │ │
│ └────────────┘ │   │                     │   │ │ Payment │ │
│                │   │ ┌─────────────────┐ │   │ │ Gateway │ │
│ ┌────────────┐ │   │ │ Search Ranking  │ │   │ └─────────┘ │
│ │ Intent     │ │   │ └─────────────────┘ │   │             │
│ │Classifier  │ │   │                     │   │ ┌─────────┐ │
│ └────────────┘ │   │ ┌─────────────────┐ │   │ │Firebase │ │
│                │   │ │ Dispute         │ │   │ │   FCM   │ │
│ ┌────────────┐ │   │ │ Resolver        │ │   │ │  Push   │ │
│ │ GPT-4o     │ │   │ └─────────────────┘ │   │ └─────────┘ │
│ │ LLM API    │ │   │                     │   │             │
│ └────────────┘ │   │ ┌─────────────────┐ │   │ ┌─────────┐ │
│                │   │ │ Notification    │ │   │ │Termii   │ │
│ ┌────────────┐ │   │ │ Dispatcher      │ │   │ │  SMS    │ │
│ │ Whisper    │ │   │ └─────────────────┘ │   │ └─────────┘ │
│ │Speech-to   │ │   │                     │   │             │
│ │   -Text    │ │   │                     │   │ ┌─────────┐ │
│ └────────────┘ │   │                     │   │ │Cloudinary│
│                │   │                     │   │ │  Image  │ │
│                │   │                     │   │ │ Storage │ │
│                │   │                     │   │ └─────────┘ │
└────────────────┘   └─────────────────────┘   └─────────────┘
        │                       │
        └───────────────────────┼───────────────────────┐
                                │                       │
                                │                       │
┌───────────────────────────────▼───────────────────────▼──────┐
│                        DATA LAYER                            │
│                                                              │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   PostgreSQL     │  │   Pinecone   │  │    Redis     │  │
│  │   (Relational)   │  │   (Vector)   │  │  (Caching)   │  │
│  │                  │  │              │  │              │  │
│  │ • Users          │  │ • Product    │  │ • Sessions   │  │
│  │ • Products       │  │   Embeddings │  │ • Search     │  │
│  │ • Orders         │  │ • Semantic   │  │   Cache      │  │
│  │ • Transactions   │  │   Search     │  │ • Rate       │  │
│  │ • Reviews        │  │   Index      │  │   Limiting   │  │
│  │ • Disputes       │  │              │  │ • Temp Data  │  │
│  │ • Messages       │  │              │  │              │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Layer Descriptions

#### 1. USER LAYER (Frontend)

**Platform:** Flutter (Single codebase for iOS & Android)

**Key Components:**
- Chat interface (primary UI)
- Product listing screens
- Order tracking screens
- Vendor dashboard
- Payment integration
- Camera/gallery access
- Push notification handler

**Why Flutter:**
- Single codebase = 50% faster development
- Excellent performance on low-end devices
- Large Nigerian developer community
- Offline capability (SQLite storage)
- Native look-and-feel on both platforms

**Offline Features:**
- Save draft messages locally
- Cache product listings (24-hour TTL)
- Queue notifications for sync when online
- Show cached order history

---

#### 2. APPLICATION LAYER (Backend)

**Technology:** Python + FastAPI

**Why Python:**
- Best AI/ML library ecosystem
- Fast async support (handles 1,000+ concurrent users)
- Easy integration with OpenAI, Pinecone
- Strong typing (prevents bugs)

**API Modules:**

**Auth API**
- Phone OTP login/signup
- Session management
- Token refresh
- Password reset (future)

**Chat API**
- Message sending/receiving
- Conversation history
- AI response generation
- Voice note processing

**Products API**
- Create listing (natural language)
- Search products (semantic)
- Update inventory
- Delete listing

**Payments API**
- Initialize transaction
- Process payment
- Manage escrow
- Handle refunds

**Orders API**
- Create order
- Update status
- Track delivery
- Confirm receipt

**Disputes API**
- File complaint
- Upload evidence
- Mediate resolution
- Execute decisions

**Reviews API**
- Submit rating
- Post review
- Moderate content
- Vendor response

**Webhooks API**
- Paystack payment events
- Transfer confirmations
- Chargeback notifications

---

#### 3. AI SERVICES LAYER

**Language Detection**
- Identifies: English, Hausa, Yoruba, Igbo, Pidgin
- 95%+ accuracy
- <100ms processing time

**Intent Classification**
- Determines user goal: BUY, SELL, INQUIRE, COMPLAIN
- Extracts entities: product, location, quantity, price
- Uses GPT-4o function calling

**LLM Integration (GPT-4o)**
- Conversational AI brain
- Generates natural responses
- Handles ambiguity with clarifying questions
- Learns from conversation history

**Speech-to-Text (Whisper)**
- Converts voice notes to text
- Handles Nigerian accents
- Supports all 5 languages
- 90%+ accuracy

**Embedding Generation**
- Converts products to mathematical vectors
- Enables semantic search
- Uses OpenAI text-embedding-3-small
- 512 dimensions (fast, accurate)

---

#### 4. BUSINESS LOGIC LAYER

**Escrow Manager**
- Holds payments securely
- Schedules auto-release (48 hours)
- Processes manual releases
- Handles refunds

**Search Ranking Engine**
- Multi-factor scoring:
  - Semantic relevance (35%)
  - Geographic distance (25%)
  - Vendor rating (20%)
  - Transaction history (15%)
  - Listing freshness (5%)

**Dispute Resolver**
- AI mediation for simple cases
- Escalation to humans for complex cases
- Decision execution (refunds, replacements)
- Strike system management

**Notification Dispatcher**
- Push notifications (Firebase)
- SMS (Termii)
- Email (future)
- In-app notifications

---

#### 5. EXTERNAL SERVICES

**Paystack (Payment Gateway)**
- Card processing
- Bank transfer
- USSD payments
- Mobile money
- Subaccount management
- Transfer API for payouts

**Firebase Cloud Messaging (Push Notifications)**
- Cross-platform (iOS + Android)
- Real-time delivery
- Rich notifications (images, actions)
- Free tier sufficient for MVP

**Termii (SMS)**
- OTP for phone verification
- Critical order notifications
- ₦2-4 per SMS
- 95%+ delivery rate

**Cloudinary (Image Storage)**
- Photo uploads from app
- Auto-compression (WebP)
- CDN for fast loading
- Thumbnail generation
- Free tier: 25GB (10,000+ products)

---

#### 6. DATA LAYER

**PostgreSQL (Relational Database)**

**Core Tables:**
- `users` - Buyer/seller profiles, wallet balances, ratings
- `products` - Listings with photos, prices, inventory
- `orders` - Transaction records, status tracking
- `transactions` - Payment details, escrow state
- `reviews` - Ratings, comments, responses
- `disputes` - Complaints, evidence, resolutions
- `messages` - Conversation history with AI

**Why PostgreSQL:**
- Proven reliability (20+ years)
- ACID transactions (critical for payments)
- Geospatial queries (distance calculations)
- JSON support (flexible metadata)
- Excellent performance at scale

**Pinecone (Vector Database)**

**Purpose:** Semantic product search

**How It Works:**
1. Product listed → Text converted to 512-number vector
2. Vector stored with product ID
3. User searches → Query converted to vector
4. Pinecone finds similar vectors (cosine similarity)
5. Returns product IDs ranked by relevance

**Why Pinecone:**
- Managed service (no ops)
- Millisecond query times
- Handles millions of vectors
- Auto-scaling
- $70/month for 1M vectors (100,000 products)

**Redis (Caching Layer)**

**Cached Data:**
- User sessions (24-hour TTL)
- Popular search queries (1-hour TTL)
- Vendor ratings (6-hour TTL)
- API rate limits

**Why Redis:**
- In-memory (microsecond access)
- Reduces database load by 60%
- Automatic expiration (TTL)
- Pub/sub for real-time features

---

### Data Flow Examples

#### Example 1: Search Flow

```
1. User types: "I need rice in Gwagwalada"
   ↓
2. Mobile app → API Gateway → Chat API
   ↓
3. Chat API → GPT-4o: "User wants to buy rice in Gwagwalada"
   ↓
4. GPT-4o → Function call: search_products(product="rice", location="Gwagwalada")
   ↓
5. Backend → Embedding API: Convert "rice" to vector
   ↓
6. Backend → Pinecone: Find similar product vectors
   ↓
7. Pinecone returns: [product_id_1, product_id_2, product_id_3...]
   ↓
8. Backend → PostgreSQL: SELECT * FROM products WHERE id IN (...)
   ↓
9. PostgreSQL returns: Full product details (price, photo, seller)
   ↓
10. Backend → Ranking engine: Sort by distance + rating
    ↓
11. Backend → GPT-4o: Format response in natural language
    ↓
12. GPT-4o generates: "I found 4 options near Gwagwalada..."
    ↓
13. API → Mobile app: JSON response with products
    ↓
14. Mobile app displays: Product cards in chat
```

**Total Time:** <3 seconds

---

#### Example 2: Payment Flow

```
1. User taps "Buy Now" on product
   ↓
2. Mobile app → Orders API: Create order
   ↓
3. Orders API → PostgreSQL: INSERT INTO orders (status=PENDING_PAYMENT)
   ↓
4. Orders API → Payments API: Initialize payment
   ↓
5. Payments API → Paystack: POST /transaction/initialize
   ↓
6. Paystack returns: Authorization URL
   ↓
7. Mobile app: Opens Paystack payment page (WebView)
   ↓
8. User enters card details → Paystack processes
   ↓
9. Paystack → Webhooks API: POST /webhooks/paystack (charge.success)
   ↓
10. Webhooks API verifies signature
    ↓
11. Webhooks API → PostgreSQL: UPDATE orders SET status=PAID
    ↓
12. Webhooks API → Transactions: INSERT (status=HELD, escrow_start=NULL)
    ↓
13. Webhooks API → Notification Dispatcher
    ↓
14. Dispatcher → Firebase: Send push to buyer ("Payment confirmed!")
    ↓
15. Dispatcher → Firebase: Send push to seller ("New order!")
    ↓
16. Dispatcher → Termii: Send SMS to seller
```

**Total Time:** <60 seconds

---

### Infrastructure & Hosting

**MVP Phase (Months 1-6):**

**Backend Hosting:** Railway.app
- One-click deployment from GitHub
- Auto-scaling (0 to 100 containers)
- $20/month starter tier
- ~200ms latency to Nigeria (acceptable for MVP)

**Database:** Railway PostgreSQL
- Managed service (automated backups)
- 10GB storage included
- Scales vertically (more RAM/CPU as needed)

**Why Railway for MVP:**
- Fastest time to market
- No DevOps overhead
- Generous free tier
- Easy migration to GCP later

---

**Production Phase (Months 7+):**

**Backend Hosting:** Google Cloud Platform (GCP)
- Cloud Run (serverless containers)
- Auto-scales 0 to 1,000+ instances
- Pay per request (cost-effective)
- ~150ms latency (Lagos region)

**Database:** Cloud SQL (PostgreSQL)
- Automated backups (point-in-time recovery)
- Read replicas for scaling
- 99.95% uptime SLA
- Automatic failover

**Caching:** Cloud Memorystore (Redis)
- Fully managed
- Sub-millisecond latency
- High availability

**Monitoring:** Google Cloud Operations
- Real-time logs
- Error tracking
- Performance metrics
- Alerting

**Why GCP for Production:**
- Lagos region (low latency for Nigeria)
- Better price/performance than AWS
- Integrated services (less vendor management)
- Strong Nigerian presence

---

### Security Architecture

**Authentication:**
- Phone-based (OTP via SMS)
- JWT tokens (24-hour expiration)
- Refresh tokens (30-day expiration)
- Secure token storage on device

**Data Encryption:**
- HTTPS everywhere (TLS 1.3)
- Database encryption at rest (AES-256)
- Payment data never stored (handled by Paystack)

**API Security:**
- Rate limiting (100 requests/minute per user)
- CORS policies (mobile apps only)
- Input validation (prevent injection attacks)
- Webhook signature verification

**Privacy Compliance:**
- NDPR (Nigeria Data Protection Regulation)
- Explicit consent for data collection
- Right to data deletion
- 7-year financial record retention

---

### Scalability Plan

**Current Capacity (MVP):**
- 5,000 users
- 1,000 concurrent connections
- 500 transactions/day
- 10,000 messages/day

**6-Month Target:**
- 20,000 users
- 3,000 concurrent connections
- 2,000 transactions/day
- 40,000 messages/day

**12-Month Target:**
- 50,000 users
- 10,000 concurrent connections
- 5,000 transactions/day
- 100,000 messages/day

**Scaling Strategy:**

**Vertical Scaling (Short-term):**
- Increase server RAM/CPU
- Faster database instance
- More Redis memory

**Horizontal Scaling (Long-term):**
- Multiple API servers (load balanced)
- Database read replicas (5 reads, 1 write)
- Microservices separation (split Chat, Payments, Search)
- CDN for images (Cloudinary handles this)

**Cost Projections:**

| Users | Infrastructure Cost/Month | AI API Cost/Month | Total |
|-------|--------------------------|-------------------|-------|
| 1,000 | ₦50,000 | ₦50,000 | ₦100,000 |
| 5,000 | ₦100,000 | ₦150,000 | ₦250,000 |
| 20,000 | ₦200,000 | ₦400,000 | ₦600,000 |
| 50,000 | ₦500,000 | ₦800,000 | ₦1,300,000 |

---

*END OF EXECUTIVE VERSION*
