import os
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from TTS.api import TTS

app = Flask(__name__)
CORS(app)

# Initialize TTS model
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

# Create output directory if it doesn't exist
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tts_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.route('/speak', methods=['POST'])
def speak():
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
            
        text = data.get('text', '').strip()
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        print(f"Processing text: {text}")
        
        # Create unique filename
        output_filename = f"output_{hash(text)}.wav"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Generate speech
        print(f"Generating audio to {output_path}")
        try:
            tts.tts_to_file(text=text, file_path=output_path)
            print("Audio generation complete")
        except Exception as e:
            print(f"Error generating audio: {str(e)}")
            raise
        
        # Send file
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=output_filename
        )
        
    except Exception as e:
        error_msg = str(e)
        print(f"Error processing request: {error_msg}")
        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    print("Starting TTS server...")
    app.run(port=5002, debug=True)

if __name__ == '__main__':
    app.run(port=5002)
