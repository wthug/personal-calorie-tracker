const router = require('express').Router();
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route('/analyze-food').post(upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        const apiKey = process.env.GOOGLE_API_KEY;

        // If no API key is set, return mock data for testing UI integration
        if (!apiKey) {
            console.log('No GEMINI_API_KEY provided. Returning mock AI data.');
            return res.json([
                {
                    name: "Mock Analyzed Apple",
                    quantity: "1 medium",
                    calories: 95,
                    protein: 0.5,
                    carbs: 25,
                    fat: 0.3
                },
                {
                    name: "Mock Analyzed Banana",
                    quantity: "1 large",
                    calories: 121,
                    protein: 1.5,
                    carbs: 31,
                    fat: 0.4
                }
            ]);
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `Analyze this image of food or a nutrition label. 
Please identify the individual food items or the product information.
Return ONLY a strictly valid JSON array of objects with the following keys and appropriate guessed values:
- "name" (String): The name of the food item
- "quantity" (String): The estimated quantity (e.g. "1 bowl", "100g")
- "calories" (Number): Estimated total calories
- "protein" (Number): Estimated total protein in grams
- "carbs" (Number): Estimated total carbohydrates in grams
- "fat" (Number): Estimated total fat in grams

Do not wrap the response in markdown blocks like \`\`\`json. Return strictly the unformatted JSON array string.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: req.file.buffer.toString('base64'),
                        mimeType: req.file.mimetype
                    }
                }
            ]
        });

        const rawText = response.text;

        let cleanedJson = rawText.trim();

        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/```/g, '').trim();
        }

        const parsedData = JSON.parse(cleanedJson);

        res.json(parsedData);

    } catch (err) {
        console.error('AI Analysis Error:', err);
        res.status(500).json({ error: 'Failed to analyze image: ' + err.message });
    }
});

module.exports = router;
