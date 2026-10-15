"""Put a scored run's numbers on the website. Local, no spend, standard library only.

    python website/update_results.py decision-model/experiments/clean_pairs/results/product-005

Reads the run's metrics.json and manifest.json (written by run_mix.py and score_mix.py) and writes
website/public/assets/results.js, the one file the page takes its numbers from. Nothing else on the
site holds a measured number of ours, so the page cannot disagree with the run.

What goes out: the index over the exam sample, each exam benchmark's score with its chance level,
which of those benchmarks had their own training file in the mix, and the average over the sources
the model never trained on. Run names, costs and source names stay here.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / 'public' / 'assets' / 'results.js'
BOARD_BENCHMARKS = 37          # benchmarks in the public index of Decision Index 0.3
# catalog id: (area, short name, what one question asks, in our own words)
BENCHMARKS = {
    1: ('tools', 'BFCL', 'For each tool on offer: does this request need it?'),
    2: ('tools', 'ToolRet', 'Rate how useful each of 32 candidate tools is for a request.'),
    3: ('tools', 'API-Bank', 'Pick the next API call in an assistant conversation.'),
    9: ('tools', 'Home appliances', 'Answer every question about carrying out a command in a simulated home.'),
    62: ('tools', 'When2Call', 'Call a tool, ask a follow-up question, answer, or decline?'),
    4: ('retrieval', 'BANKING77', 'Pick a bank customer\'s intent out of 77.'),
    5: ('retrieval', 'CLINC150', 'Pick a request\'s intent out of 150, or say it is out of scope.'),
    36: ('retrieval', 'BRIGHT', 'Rate how helpful each of 32 documents is for a hard question.'),
    37: ('retrieval', 'Amazon ESCI', 'Is a product an exact match, a substitute, a complement or irrelevant to a search?'),
    56: ('retrieval', 'PhishNChips', 'Is this email phishing or legitimate?'),
    11: ('language', 'ContractNLI', 'Does a contract support, contradict or leave out a statement?'),
    12: ('language', 'ANLI', 'Does one sentence follow from another? Written to fool models.'),
    29: ('language', 'HellaSwag', 'Pick the ending that makes sense.'),
    38: ('language', 'ACOS', 'Which topics a review talks about, and how the writer feels about each.'),
    39: ('language', 'FinEntity', 'How financial news feels about a named company.'),
    40: ('language', 'iSarcasmEval', 'Is this tweet sarcastic?'),
    41: ('language', 'VAST', 'Is the writer for, against or neutral on a topic?'),
    42: ('language', 'NLI4CT', 'Does a clinical trial report support or contradict a statement?'),
    59: ('language', 'RAGTruth', 'Does an answer say things its source does not?'),
    25: ('knowledge', 'GPQA Diamond', 'Hard science questions written by experts.'),
    30: ('knowledge', 'GSM8K', 'Pick the answer to a maths word problem, with no working.'),
    31: ('knowledge', 'ChessBench', 'Pick the strongest move in a chess position.'),
    32: ('knowledge', 'MuSR', 'Answer a question that needs clues from across a long story.'),
    33: ('knowledge', 'SATA-Bench', 'Say yes or no to each candidate answer; all must be right.'),
    43: ('knowledge', 'CRUXEval', 'Pick what a short piece of code returns, without running it.'),
    44: ('knowledge', 'CLadder', 'Yes or no questions about cause and effect in a made-up world.'),
    45: ('knowledge', 'HLE', 'Expert-level exam questions.'),
    57: ('knowledge', 'MMLU-Pro', 'Questions across 14 subjects, with up to ten options.'),
    58: ('knowledge', 'BBH', 'Tricky reasoning tasks, answered with no working.'),
    28: ('knowledge', 'WinoGrande', 'Fill a blank with one of two options, using common sense.'),
    20: ('arts', 'BPoMP', 'Of two versions of a limerick, one of them damaged, pick the original.'),
    21: ('arts', 'Humicroedit', 'Which of two edited headlines did people find funnier?'),
    22: ('arts', 'POP909-CL', 'Name the chord playing at a point in a pop song, from its notes.'),
    23: ('arts', 'cfcolor', 'Predict which of two colour palettes a person rated higher.'),
    50: ('arts', 'Habermas Machine', 'Predict which statement a group ranked highest on a policy question.'),
    64: ('arts', 'New Yorker captions', 'Pick the caption written for a described cartoon, out of five.'),
}
AREAS = {'tools': 'Tools & Automation', 'retrieval': 'Retrieval & Classification', 'language': 'Language Understanding',
         'knowledge': 'Knowledge & Reasoning', 'arts': 'Arts & Human Taste'}
# A benchmark training file in the mix -> the exam benchmark it belongs to (None: that benchmark is not in the index).
TRAINED_FOR = {'bench_acos': 38, 'bench_apibank': 3, 'bench_arc': None, 'bench_banking77': 4, 'bench_cladder': 44, 'bench_clinc150': 5,
               'bench_commonsenseqa': None, 'bench_contractnli': 11, 'bench_esci': 37, 'bench_finentity': 39, 'bench_gsm8k': 30,
               'bench_hellaswag': 29, 'bench_isarcasm': 40, 'bench_nli4ct': 42, 'bench_openbookqa': None, 'bench_vast': 41,
               'bench_when2call': 62, 'bench_winogrande': 28}


def build(folder):
    folder = Path(folder)
    metrics = json.loads((folder / 'metrics.json').read_text(encoding='utf-8'))
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    if metrics.get('status') != 'complete' or metrics.get('examStop'):
        raise SystemExit(f"{folder.name}: not a complete run with a whole exam; its numbers do not go on the site")
    unknown = [name for name in manifest.get('benchmarkTrainingData') or [] if name not in TRAINED_FOR]
    if unknown:
        raise SystemExit(f"benchmark training files this script does not know: {unknown}; add them to TRAINED_FOR")
    trained = {TRAINED_FOR[name] for name in manifest.get('benchmarkTrainingData') or []} - {None}
    rows = []
    for name, row in metrics['exam']['benchmarks'].items():
        if row['number'] not in BENCHMARKS:
            raise SystemExit(f"{name} (catalog id {row['number']}) is not in BENCHMARKS; add it")
        area, short, asks = BENCHMARKS[row['number']]
        rows.append({'id': row['number'], 'name': short, 'area': area, 'asks': asks, 'metric': row['metric'],
                     'score': round(row['value'], 4), 'chance': round(row['chance'], 4), 'skill': round(row['skill'], 4),
                     'answered': round(row['answeredShare'], 4), 'trainedOnItsTrainingSet': row['number'] in trained})
    rows.sort(key=lambda r: (-r['skill'], r['name']))
    unseen, floors = metrics['unseenBySource'], metrics['commonestAnswerFloors']['unseen']
    return {
        'measured': manifest['startedAt'][:10],
        'index': metrics['exam']['partialIndex'],
        'benchmarksInIndex': metrics['exam']['benchmarksInIndex'],
        'boardBenchmarks': BOARD_BENCHMARKS,
        'trainedOnTrainingSets': sum(r['trainedOnItsTrainingSet'] for r in rows),
        'neverTrained': {'sources': len(unseen), 'score': round(sum(unseen.values()) / len(unseen), 4),
                         'floor': round(sum(floors[name] for name in unseen) / len(unseen), 4)},
        'areas': AREAS,
        'benchmarks': rows,
    }


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    result = build(sys.argv[1])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text('// Written by website/update_results.py. Do not edit by hand: run the script again.\n'
                   'window.FRQ_RESULTS = ' + json.dumps(result, indent=2, ensure_ascii=False) + ';\n', encoding='utf-8')
    never = result['neverTrained']
    print(f"{OUT}: index {result['index']} over {result['benchmarksInIndex']} benchmarks, measured {result['measured']}; "
          f"{result['trainedOnTrainingSets']} of them trained on their own training set; "
          f"never-trained sources {100 * never['score']:.1f}% (floor {100 * never['floor']:.1f}%)")


if __name__ == '__main__':
    main()
