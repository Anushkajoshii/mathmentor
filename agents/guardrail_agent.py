def check_input(text):

    banned = ["hack", "attack", "exploit"]

    for b in banned:

        if b in text.lower():

            return False

    return True