from rest_framework import serializers

TASK_CHOICES = ["classification", "regression"]


class TargetAnalysisRequestSerializer(serializers.Serializer):
    dataset_id = serializers.CharField()
    feature_columns = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    target_column = serializers.CharField()


class TrainRequestSerializer(serializers.Serializer):
    dataset_id = serializers.CharField()
    feature_columns = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    target_column = serializers.CharField()
    task = serializers.ChoiceField(choices=TASK_CHOICES)
    model_key = serializers.CharField()
    test_size = serializers.FloatField(min_value=0.1, max_value=0.8, default=0.2)
    random_state = serializers.IntegerField(default=42)


class PredictRequestSerializer(serializers.Serializer):
    model_id = serializers.CharField()
    inputs = serializers.DictField()
