class Repo:
    def get(self, key):
        return self.load(key)

    def load(self, key):
        return parse(key)

def parse(text):
    return text.strip()
