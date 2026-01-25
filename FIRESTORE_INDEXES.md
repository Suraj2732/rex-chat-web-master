# Required Firestore Composite Indexes

## How to Create Indexes

1. Go to Firebase Console → Firestore → Indexes
2. Click "Create Index"
3. Add the following indexes:

## Index 1: Chats by Participants and Last Message Time

**Collection:** `chats`
**Fields:**
- `participants` (Array-contains) - Ascending
- `lastMessageTime` - Descending

**Query:**
```typescript
query(
  chatsRef,
  where('participants', 'array-contains', userId),
  orderBy('lastMessageTime', 'desc')
)
```

**Index ID:** `chats-participants-lastMessageTime`

---

## Index 2: Messages by ChatId and CreatedAt (Descending)

**Collection:** `chats/{chatId}/messages`
**Fields:**
- `chatId` - Ascending
- `createdAt` - Descending

**Query:**
```typescript
query(
  messagesRef,
  orderBy('createdAt', 'desc'),
  limit(50)
)
```

**Index ID:** `messages-chatId-createdAt-desc`

---

## Index 3: Messages by ChatId and CreatedAt (Ascending)

**Collection:** `chats/{chatId}/messages`
**Fields:**
- `chatId` - Ascending
- `createdAt` - Ascending

**Query:**
```typescript
query(
  messagesRef,
  orderBy('createdAt', 'asc')
)
```

**Index ID:** `messages-chatId-createdAt-asc`

---

## Index 4: Messages by ReadBy (for mark as read)

**Collection:** `chats/{chatId}/messages`
**Fields:**
- `readBy` - Array-contains-any
- `createdAt` - Descending

**Query:**
```typescript
query(
  messagesRef,
  where('readBy', 'array-contains-any', []),
  orderBy('createdAt', 'desc')
)
```

**Index ID:** `messages-readBy-createdAt-desc`

---

## Alternative: Use firestore.indexes.json

Create `firestore.indexes.json` in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "chats",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "lastMessageTime",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "chatId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "chatId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## Verify Indexes

After creating indexes, verify they're being used:
1. Check Firebase Console → Firestore → Usage
2. Look for index usage in query statistics
3. Monitor for any "index required" errors in console

---

## Performance Impact

Without indexes:
- Queries may fail or perform full collection scans
- Slow response times (5-10+ seconds)
- High read costs

With indexes:
- Fast queries (< 100ms)
- Efficient reads
- Lower costs
