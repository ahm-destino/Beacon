import cloudinary
import cloudinary.uploader
from flask import current_app

class CloudinaryService:
    @staticmethod
    def _configure():
        cloudinary.config(
            cloud_name=current_app.config['CLOUDINARY_CLOUD_NAME'],
            api_key=current_app.config['CLOUDINARY_API_KEY'],
            api_secret=current_app.config['CLOUDINARY_API_SECRET'],
            secure=True
        )

    @classmethod
    def upload_document(cls, file_stream, filename):
        """
        Uploads a PDF document to Cloudinary.
        Returns the secure URL.
        """
        cls._configure()
        try:
            result = cloudinary.uploader.upload(
                file_stream,
                folder="beacon/documents",
                resource_type="raw",
                public_id=filename,
                overwrite=True
            )
            return result.get('secure_url')
        except Exception as e:
            current_app.logger.error(f"Cloudinary upload failed: {str(e)}")
            return None

    @classmethod
    def delete_document(cls, public_id):
        """
        Deletes a document from Cloudinary.
        """
        cls._configure()
        try:
            cloudinary.uploader.destroy(
                f"beacon/documents/{public_id}",
                resource_type="raw"
            )
            return True
        except Exception:
            return False
