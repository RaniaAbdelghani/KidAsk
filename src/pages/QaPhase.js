import { Card, CardContent, Checkbox, FormControl, FormControlLabel, FormGroup, TextField, Typography } from "@material-ui/core";
import React, { useContext, useEffect, useRef, useState } from "react"
import Resize from "react-resize-layout/dist/Resize";
import ResizeHorizon from "react-resize-layout/dist/ResizeHorizon";
import { Redirect, useParams } from "react-router";
import ChatMessage from "../components/ChatMessage";
import ContentWrapper, { ContentButtonWrapper, FigureWrapper } from "../components/ContentWrapper";
import { StoryWrapper } from "../components/StoryWrapper";
import { ButtonsWrapper } from "../components/TopicQuiz.styled";
import quPhase from "../data/quPhase";
import { topicLabels } from "../data/topics";
import useStyles from "../useStyles";
import { Button } from "../components/Button"
import UserContext from "../context/UserContext";
import { addUserInput } from "../services";

export default function QaPhase() {
  let { id, nextTopic } = useParams();
  const topic = quPhase[id]

  const [slideIndex, setSlideIndex] = useState(0)

  const [showQuestions, setShowQuestions] = useState(false)

  const [questionIndex, setQuestionIndex] = useState(0)

  const [phaseEnded, setPhaseEnded] = useState(false)

  const [question, setQuestion] = useState('')

  const [state, setState] = React.useState({})

  const { user } = useContext(UserContext)

  const previousUrl = useRef('');
  const audioRef = useRef();

  
  useEffect(() => {
    if (topic.slides[slideIndex]) {
      if (previousUrl.current === topic.slides[slideIndex].audio) {
        return;
      }
  
      if (audioRef.current) {
        audioRef.current.load();
      }
  
      previousUrl.current = topic.slides[slideIndex].audio;
    }
  }, [slideIndex]);

  const handleChange = (event) => {
    setState({ [event.target.name]: event.target.checked });
  }

  const classes = useStyles()

  const finishedReading = () => {
    setShowQuestions(true)
  }

  const handleChangeQuestion = (e) => {
    setQuestion(e.target.value)
  }

  const nextQuestion = async () => {
    await addUserInput(user.identifiant, 'qa-phase', `${id}/slides/${topic.slides[slideIndex].text.substring(0, 40).replace(/\//g, '-')}/questions/${questionIndex}`, {
      text: topic.slides[slideIndex].text,
      prompt: Object.keys(state).length ? Object.keys(state)[0]: "no-prompt",
      question
    })
    setState({})
    setQuestion('')
    if (questionIndex + 1 < 6) {
      setQuestionIndex(questionIndex + 1)
    } else if (slideIndex + 1 < topic.slides.length) {
      setShowQuestions(false)
      setQuestionIndex(0)
      setSlideIndex(slideIndex + 1)
    } else {
      setPhaseEnded(true)
    }
  }

  return <div>

    {
      phaseEnded &&
      <Redirect to={`/pre-exploration-intro/${nextTopic}`} />
    }

    <div style={{ position: "relative", height: '100vh' }}>
      <Resize handleWidth="5px" handleColor="#ddd">
        <ResizeHorizon width="calc(100vw / 3 * 2)">
          <ContentWrapper>
            <Typography variant="h5" className={classes.title}>
              Theme: {topicLabels[id]}
            </Typography>
            <FigureWrapper>
              <img src={topic.slides[slideIndex].image} />
            </FigureWrapper>
            <StoryWrapper>
              {
                topic.slides[slideIndex].text.split('\n').map(line => (
                  <p>{line} <br /></p>
                ))
              }
              <audio controls ref={audioRef}>
                <source src={topic.slides[slideIndex].audio} type="audio/mp3"></source>
              </audio>

            </StoryWrapper>
            {
              !showQuestions &&
              <ContentButtonWrapper>
                <Button onClick={finishedReading} variant="contained">J'ai fini de lire</Button>
              </ContentButtonWrapper>
            }
          </ContentWrapper>
        </ResizeHorizon  >
        <ResizeHorizon width="calc(100vw / 3)">
          <ContentWrapper>
            <Typography variant="h5" className={classes.title}>
              Espace agent
            </Typography>

            {
              showQuestions && questionIndex < 5 &&
              <>
                {
                  user.help &&
                  
                   <ChatMessage text={
                     `J'ai pu penser à une question qui commence par '${topic.slides[slideIndex].questions[questionIndex].starter}' à propos de ce texte. Veux-tu la deviner? `
                   }>
                  </ChatMessage>
                  }
                  {
                    <ChatMessage text={
                     `La réponse à cette question apparaît dans cet encadré. Appuie dessus pour la deviner! `
                   }>

                
              </ChatMessage>
                }
                {
                  
                    <Card variant="outlined">
                      <CardContent>
                        <FormControl component="fieldset" className={classes.formControl}>
                          <FormGroup>
                            {
                              topic.slides[slideIndex].questions[questionIndex].options.map(op => {
                                return <FormControlLabel
                                  control={
                                    <Checkbox
                                      color="primary"
                                      onChange={handleChange}
                                      checked={!!state[op]}
                                      name={op} />
                                  }
                                  label={op}
                                />
                              })
                            }
                          </FormGroup>
                        </FormControl>
                      </CardContent>
                    </Card>
                  
                
                
                }
                

                {
                  !user.help &&
                  <ChatMessage text={
                    `Hum, I could think of a question that starts with '${topic.slides[slideIndex].questions[questionIndex].starter}' about this text, try to guess it!`
                  } />
                }

                {
                  (Object.keys(state).length > 0 || !user.help) &&
                  <>
                    <ChatMessage text={
                      user.help ? `Super! Tu peux maintenant entrer ta question. Prends ton temps pour formuler!` : 'Rappelle-toi, la réponse à ma question ne figure pas dans le texte.Prends ton temps pour formuler!'
                    } />

                    <TextField value={question} onChange={handleChangeQuestion} id="standard-basic" label="Mets ta question ici" fullWidth />

                    <ContentButtonWrapper>
                      <Button onClick={nextQuestion} varian225t="contained" disabled={!question}>Soumettre</Button>
                    </ContentButtonWrapper>
                  </>
                }

              </>
            }

            {
              showQuestions && questionIndex  === 5 &&
              <>
                <ChatMessage text={
                  `Maintenant essaie de formuler ta question tout seul, comme on s'est entrainés ensemble.`
                } />
                <ChatMessage text={
                  `Attention, tu ne peux pas répéter une question précédente et la réponse ne doit pas figurer dans le texte.`
                } />
                        
                <TextField id="standard-basic" label="Mets ta question ici" fullWidth onChange={handleChangeQuestion} />

                <ContentButtonWrapper>
                  <Button onClick={nextQuestion} variant="contained" disabled={!question}>Soumettre</Button>
                </ContentButtonWrapper>
              </>
            }
          </ContentWrapper>
        </ResizeHorizon>
      </Resize>
    </div>
  </div>
}
