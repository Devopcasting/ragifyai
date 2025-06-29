import nltk
import re
from typing import List
import os

# Download NLTK data if not already downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

class TextProcessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        # Add custom stop words specific to document processing
        self.custom_stop_words = {
            'page', 'chapter', 'section', 'figure', 'table', 'reference',
            'appendix', 'footnote', 'header', 'footer', 'abstract', 'introduction',
            'conclusion', 'summary', 'bibliography', 'index'
        }
        self.stop_words.update(self.custom_stop_words)
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}]', '', text)
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        return text.strip()
    
    def remove_stop_words(self, text: str) -> str:
        """Remove stop words from text"""
        # Tokenize the text
        words = word_tokenize(text.lower())
        
        # Remove stop words
        filtered_words = [word for word in words if word.lower() not in self.stop_words]
        
        # Rejoin the words
        return ' '.join(filtered_words)
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract keywords from text"""
        # Clean and tokenize
        cleaned_text = self.clean_text(text)
        words = word_tokenize(cleaned_text.lower())
        
        # Remove stop words and short words
        filtered_words = [
            word for word in words 
            if word.lower() not in self.stop_words and len(word) > 3
        ]
        
        # Count word frequencies
        from collections import Counter
        word_freq = Counter(filtered_words)
        
        # Return top keywords
        return [word for word, _ in word_freq.most_common(max_keywords)]
    
    def split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        from nltk.tokenize import sent_tokenize
        sentences = sent_tokenize(text)
        return [s.strip() for s in sentences if s.strip()]
    
    def preprocess_for_embedding(self, text: str) -> str:
        """Preprocess text for embedding generation"""
        # Clean the text
        cleaned_text = self.clean_text(text)
        
        # Remove stop words (optional - depends on use case)
        # processed_text = self.remove_stop_words(cleaned_text)
        
        return cleaned_text

# Global text processor instance
text_processor = TextProcessor() 