import warnings
import logging
import pytest
import numpy as np
import time
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from ragas.evaluation import evaluate
from datasets import Dataset
from app.ai.tools.rag_tool import policy_rag_tool


warnings.filterwarnings("ignore", category=DeprecationWarning)

logging.basicConfig(level=logging.INFO)

@pytest.fixture
def raw_examples():
    return [
        {
            "question": "¿Qué cubre la póliza contra robos?",
            "ground_truth": "La póliza cubre pérdidas materiales por robo dentro del domicilio asegurado.",
        },
        {
            "question": "¿Qué exclusiones tiene la póliza de autos?",
            "ground_truth": "No cubre daños por participar en carreras o bajo influencia de alcohol.",
        },
        {
            "question": "¿Cuáles son las diferencias entre la póliza de vida y la de salud?",
            "ground_truth": "La póliza de vida cubre fallecimiento y la de salud cubre enfermedades y accidentes.",
        },
        {
            "question": "¿Qué pasa si se daña el coche fuera del país?",
            "ground_truth": "La cobertura varía según la póliza. Se debe consultar la cláusula de cobertura internacional.",
        },
        {
            "question": "¿Qué produce la falta de pago de prima?",
            "ground_truth": "La falta de pago de la prima producirá la terminación del contrato a la expiración del plazo de quince días "
                            "contado desde la fecha de envío de la comunicación que, con ese objeto, dirija el asegurador al asegurado o "
                            "Contratante y dará derecho a aquél para exigir que se le pague la prima devengada hasta la fecha determinación y los gastos de formalización del contrato.",
        },
        {
            "question": "¿Que cubre la poliza de salud en emergencias?",
            "ground_truth": "Cubre atención médica inmediata por accidentes o enfermedades repentinas.",
        }
    ]


def test_ragas_evaluation(raw_examples):
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    examples = []
    start_time = time.time()

    for ex in raw_examples:
        question = ex["question"]
        ground_truth = ex["ground_truth"]

        tool_output = policy_rag_tool.invoke(question)
        context_text = tool_output.replace("Retrieved context:\n", "").strip()

        answer = context_text[:300] if context_text else "No se encontró información."
        if not answer:
            answer = "Respuesta vacía o incompleta"

        examples.append({
            "question": question,
            "answer": answer,
            "contexts": [context_text],
            "ground_truth": ground_truth
        })

    dataset = Dataset.from_list(examples)

    results = evaluate(
        dataset,
        metrics=[
            faithfulness,
            answer_relevancy,
            context_precision,
            context_recall,
        ]
    )

    assert results is not None, "The evaluation results should not be None"
    results_list = results.scores
    results_dict = {}

    for key in results_list[0].keys():
        results_dict[key] = np.mean([ex[key] for ex in results_list])

    print("\n📊 Results evaluating RAGAS:")
    print("=" * 40)
    for metric, score in results_dict.items():
        print(f"{metric.capitalize():<20}: {float(score):.4f}")
    print("=" * 40)

    assert "faithfulness" in results_dict, "Faithfulness metric not found"
    assert "answer_relevancy" in results_dict, "Answer relevancy metric not found"
    assert "context_precision" in results_dict, "Context precision metric not found"
    assert "context_recall" in results_dict, "Context recall metric not found"

    execution_time = time.time() - start_time
    print(f"\nExecution time: {execution_time:.4f} seconds")
